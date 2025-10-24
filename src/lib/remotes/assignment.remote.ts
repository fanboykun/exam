import { command, getRequestEvent, query } from '$app/server';
import { db, transaction } from '$lib/server/db';
import { RemoteResponse } from '$lib/shared/utils/remote-response';
import z from 'zod';
import * as schema from '$lib/server/db/schema';
import { dev } from '$app/environment';
import { eq, type SQL } from 'drizzle-orm';
import { decrypt, encrypt } from '$lib/server/utils/enc';

const examSessionName = 'exam_session';

export const findAssignment = query(
	z.object({ assignmentSession: z.string().min(100) }),
	async ({ assignmentSession }) => {
		const {
			locals: { user, session }
		} = getRequestEvent();
		if (!user || !session) return RemoteResponse.failure({ error: {}, message: 'Unauthorized' });
		const assignmentId = getExamSession(session, assignmentSession);
		if (!assignmentId) return RemoteResponse.failure({ error: {}, message: 'Unauthorized' });
		const assignment = await db.query.assignments.findFirst({
			where: (assignments, { eq }) => eq(assignments.id, assignmentId),
			with: {
				answers: true
			}
		});
		if (assignment && (assignment.userId !== user.id || assignment.sessionId !== session.id)) {
			return RemoteResponse.failure({ error: {}, message: 'Unauthorized' });
		}
		return RemoteResponse.success({ data: assignment, message: 'Assignment Found!' });
	}
);

export const paginateAssignments = query(
	z.object({
		page: z.coerce.number().default(1),
		limit: z.coerce.number().min(10).max(50).default(10),
		sorts: z
			.object({
				createdAt: z.enum(['asc', 'desc']).default('desc'),
				score: z.enum(['asc', 'desc']).optional()
			})
			.default({ createdAt: 'desc' })
	}),
	async ({ page, limit, sorts }) => {
		const {
			locals: { user, session }
		} = getRequestEvent();
		if (!user || !session) return RemoteResponse.failure({ error: {}, message: 'Unauthorized' });
		const assignments = await db.query.assignments.findMany({
			where: (assignments, { eq }) => eq(assignments.userId, user.id),
			offset: (page - 1) * limit,
			limit: limit,
			orderBy: (fields, operators) => {
				const sortQuery: SQL[] = [];
				Object.entries(sorts).forEach(([key, value]) => {
					if (value && typeof operators[value] === 'function') {
						sortQuery.push(operators[value](fields[key as keyof typeof fields]));
					}
				});
				return sortQuery;
			},
			with: {
				exam: true
			}
		});
		return RemoteResponse.success({ data: assignments, message: 'Assignments Found!' });
	}
);

export const createAssignment = command(
	z.object({
		examId: z.uuid()
	}),
	async ({ examId }) => {
		const {
			locals: { user, session }
		} = getRequestEvent();
		if (!user || !session) return RemoteResponse.failure({ error: {}, message: 'Unauthorized' });
		const selectedExam = await db.query.exams.findFirst({
			where: (exams, { eq }) => eq(exams.id, examId)
		});
		if (!selectedExam) return RemoteResponse.failure({ error: {}, message: 'Exam not found' });

		const assignmentId = getExamSession(session);
		if (assignmentId) {
			const maybeCurrentAssignment = await db.query.assignments.findFirst({
				where: (assignments, { eq }) => eq(assignments.id, assignmentId)
			});
			if (maybeCurrentAssignment) {
				if (
					maybeCurrentAssignment.userId !== user.id ||
					maybeCurrentAssignment.sessionId !== session.id
				) {
					return RemoteResponse.failure({ error: {}, message: 'Unauthorized' });
				}
				if (maybeCurrentAssignment.finishAt) {
					return RemoteResponse.failure({ error: {}, message: 'Assignment already submitted' });
				}
				return RemoteResponse.success({
					data: maybeCurrentAssignment,
					message: 'Assignment Created!'
				});
			}
		}

		const [newAssignment] = await db
			.insert(schema.assignments)
			.values({
				userId: user.id,
				examId: selectedExam.id,
				startAt: new Date(),
				sessionId: session.id
			})
			.returning();
		if (!newAssignment) {
			return RemoteResponse.failure({ error: {}, message: 'Failed to create assignment' });
		}
		setExamSession(newAssignment.id, selectedExam, session);
		return RemoteResponse.success({ data: newAssignment, message: 'Assignment Created!' });
	}
);

export const submitAssignment = command(
	z.object({
		assignmentId: z.uuid(),
		finishedAt: z.coerce.date(),
		answers: z.array(
			z.object({
				questionId: z.uuid(),
				choiseId: z.uuid()
			})
		)
	}),
	async ({ assignmentId, answers, finishedAt }) => {
		const {
			locals: { user, session }
		} = getRequestEvent();
		if (!user || !session) return RemoteResponse.failure({ error: {}, message: 'Unauthorized' });

		const assignmentIdFromSession = getExamSession(session);
		if (!assignmentIdFromSession || assignmentIdFromSession !== assignmentId) {
			return RemoteResponse.failure({ error: {}, message: 'Unauthorized' });
		}
		const selectedAssignment = await db.query.assignments.findFirst({
			where: (assignments, { eq }) => eq(assignments.id, assignmentId)
		});

		if (!selectedAssignment)
			return RemoteResponse.failure({ error: {}, message: 'Assignment not found' });
		if (selectedAssignment.userId !== user.id)
			return RemoteResponse.failure({ error: {}, message: 'Unauthorized' });
		if (selectedAssignment.finishAt)
			return RemoteResponse.failure({ error: {}, message: 'Assignment already submitted' });
		if (selectedAssignment.sessionId !== session.id)
			return RemoteResponse.failure({ error: {}, message: 'Unauthorized' });

		const questionsWithChoises = await db.query.questions.findMany({
			where: (questions, { eq }) => eq(questions.examId, selectedAssignment.examId),
			with: {
				choises: true
			}
		});
		if (!questionsWithChoises?.length)
			return RemoteResponse.failure({ error: {}, message: 'Invalid answers' });

		let correctAnswers = 0;
		for (const answer of answers) {
			const question = questionsWithChoises.find((question) => question.id === answer.questionId);
			if (!question) return RemoteResponse.failure({ error: {}, message: 'Invalid answers' });
			const choise = question.choises.find((choise) => choise.id === answer.choiseId);
			if (!choise) return RemoteResponse.failure({ error: {}, message: 'Invalid answers' });
			if (choise.isCorrect) correctAnswers++;
		}
		const timeTaken = selectedAssignment.startAt.getTime() - finishedAt.getTime();
		const score = correctAnswers
			? Math.round((correctAnswers / questionsWithChoises.length) * 100)
			: 0;
		const result = await transaction(async (trx) => {
			const [updatedAssignment] = await trx
				.update(schema.assignments)
				.set({
					finishAt: finishedAt,
					correctAnswer: correctAnswers,
					score
				})
				.where(eq(schema.assignments.id, selectedAssignment.id))
				.returning();
			if (!updatedAssignment)
				return RemoteResponse.failure({ error: {}, message: 'Failed to update assignment' });
			const createdAnswers = await trx
				.insert(schema.answers)
				.values(
					answers.map((answer) => ({
						assignmentId: updatedAssignment.id,
						questionId: answer.questionId,
						choiceId: answer.choiseId
					}))
				)
				.returning();
			if (!createdAnswers.length)
				return RemoteResponse.failure({ error: {}, message: 'Failed to create answers' });
			return RemoteResponse.success({
				data: { assignment: updatedAssignment, correctAnswers, timeTaken },
				message: 'Assignment Submitted!'
			});
		});
		if (result.success) deleteExamSession();
		return result;
	}
);

const setExamSession = (assignmentId: string, exam: Entity['Exam'], session: Entity['Session']) => {
	const { cookies } = getRequestEvent();
	deleteExamSession();
	const encrypted = encrypt(assignmentId, session.id);
	cookies.set(examSessionName, encrypted, {
		path: '/',
		maxAge: exam.duration ? exam.duration * 60 : undefined,
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax'
	});
};

const getExamSession = (session: Entity['Session'], compareWith?: string) => {
	const {
		cookies,
		request: { headers },
		getClientAddress
	} = getRequestEvent();
	const examSession = cookies.get(examSessionName);
	if (!examSession) return;
	const ip = getClientAddress();
	const ua = headers.get('user-agent');
	if (ip !== session.ipAddress || ua !== session.userAgent) return;
	if (compareWith && compareWith !== examSession) return;
	const decrypted = decrypt(examSession, session.id);
	return decrypted ? decrypted : undefined;
};

const deleteExamSession = () => {
	const { cookies } = getRequestEvent();
	cookies.delete(examSessionName, { path: '/' });
};
