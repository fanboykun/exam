import { query } from '$app/server';
import { db } from '$lib/server/db';
import z from 'zod';
import * as schema from '$lib/server/db/schema';
import { asc, desc, eq, type SQL, sql } from 'drizzle-orm';

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

export const paginateExams = query(
	z.object({
		page: z.number().default(1),
		limit: z.number().min(10).max(50).default(10),
		sorts: z
			.object({
				createdAt: z.enum(['asc', 'desc']).default('desc'),
				duration: z.enum(['asc', 'desc']).optional()
			})
			.default({ createdAt: 'desc' })
	}),
	async ({ page, limit, sorts }) => {
		const exams = await db
			.select({
				id: schema.exams.id,
				title: schema.exams.title,
				duration: schema.exams.duration,
				description: schema.exams.description,
				createdAt: schema.exams.createdAt,
				questionCount: sql<number>`COUNT(${schema.questions.id})`.as('questionCount')
			})
			.from(schema.exams)
			.leftJoin(schema.questions, eq(schema.exams.id, schema.questions.examId))
			.groupBy(schema.exams.id)
			.orderBy((cols) => {
				const sortQuery: SQL[] = [];
				if (sorts.createdAt) {
					sortQuery.push(sorts.createdAt === 'asc' ? asc(cols.createdAt) : desc(cols.createdAt));
				}
				if (sorts.duration) {
					sortQuery.push(sorts.duration === 'asc' ? asc(cols.duration) : desc(cols.duration));
				}
				return sortQuery;
			})
			.limit(limit)
			.offset((page - 1) * limit);
		return exams;
	}
);
