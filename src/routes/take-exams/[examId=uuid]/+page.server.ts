import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ensureAuthenticated } from '$lib/server/middlewares/ensure-authenticated';

export const load: PageServerLoad = ensureAuthenticated(
	async ({ params: { examId }, locals: { traceId }, cookies }) => {
		const exam = await db.query.exams.findFirst({
			where: (exams, { eq }) => eq(exams.id, examId),
			with: {
				questions: {
					with: {
						choises: {
							columns: {
								id: true,
								content: true,
								position: true
							}
						}
					}
				}
			}
		});
		if (!exam) return error(404, { message: 'Exam not found', traceId });
		const assignmentSession = cookies.get('exam_session');
		let assignment: (Entity['Assignment'] & { answers: Entity['Answer'][] }) | undefined =
			undefined;
		if (assignmentSession) {
			assignment = await db.query.assignments.findFirst({
				where: (assignments, { eq }) => eq(assignments.id, assignmentSession),
				with: {
					answers: true
				}
			});
		}
		return { exam, assignment };
	}
);
