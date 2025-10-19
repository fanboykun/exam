import { command, getRequestEvent } from '$app/server';
import { db, transaction } from '$lib/server/db';
import { RemoteResponse } from '$lib/shared/utils/remote-response';
import z from 'zod';
import * as schema from '$lib/server/db/schema';
import { dev } from '$app/environment';
import { eq } from 'drizzle-orm';

const examSessionName = 'exam_session';

export const createAssignment = command(
	z.object({
		examId: z.uuid()
	}),
	async ({ examId }) => {
		const {
			locals: { user },
			cookies
		} = getRequestEvent();
		if (!user) return RemoteResponse.failure({ error: {}, message: 'Unauthorized' });

		const currentExamState = cookies.get(examSessionName);
		if (currentExamState) {
			return RemoteResponse.failure({ error: {}, message: 'You are already in an exam' });
		}
		cookies.delete(examSessionName, { path: '/' });

		const selectedExam = await db.query.exams.findFirst({
			where: (exams, { eq }) => eq(exams.id, examId)
		});
		if (!selectedExam) return RemoteResponse.failure({ error: {}, message: 'Exam not found' });
		const [newAssignment] = await db
			.insert(schema.assignments)
			.values({
				userId: user.id,
				examId: selectedExam.id,
				startAt: new Date(),
				finishAt: new Date()
			})
			.returning();
		if (!newAssignment)
			return RemoteResponse.failure({ error: {}, message: 'Failed to create assignment' });
		cookies.set(examSessionName, newAssignment.id, {
			path: '/',
			maxAge: selectedExam.duration ? selectedExam.duration * 60 : undefined,
			httpOnly: true,
			secure: !dev,
			sameSite: 'lax'
		});
		return RemoteResponse.success({ data: newAssignment, message: 'Assignment Created!' });
	}
);

export const submitAssignment = command(
	z.object({
		assignmentId: z.uuid(),
		answers: z.array(
			z.object({
				questionId: z.uuid(),
				choiseId: z.uuid()
			})
		)
	}),
	async ({ assignmentId, answers }) => {
		const {
			locals: { user },
			cookies
		} = getRequestEvent();
		if (!user) return RemoteResponse.failure({ error: {}, message: 'Unauthorized' });
		const assignmentSession = cookies.get(examSessionName);
		if (!assignmentSession) {
			return RemoteResponse.failure({ error: {}, message: 'No assignment session found' });
		}
		if (assignmentId !== assignmentSession) {
			return RemoteResponse.failure({ error: {}, message: 'No assignment session found' });
		}
		const selectedAssignment = await db.query.assignments.findFirst({
			where: (assignments, { eq }) => eq(assignments.id, assignmentId)
		});
		if (!selectedAssignment)
			return RemoteResponse.failure({ error: {}, message: 'Assignment not found' });

		if (selectedAssignment.userId !== user.id)
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
		const finishedAt = new Date();
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
		if (result.success) cookies.delete(examSessionName, { path: '/' });
		return result;
	}
);
