import { query } from '$app/server';
import { db } from '$lib/server/db';
import z from 'zod';

export const findExamWithQuestionsAndChoises = query(
	z.object({ examId: z.uuid() }),
	async ({ examId }) => {
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
		return exam;
	}
);
