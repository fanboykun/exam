import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';
import { users } from './users';
import { exams } from './exams';
import { answers } from './answers';

export const assignments = sqliteTable('assignments', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	examId: text('exam_id')
		.notNull()
		.references(() => exams.id, { onDelete: 'cascade' }),
	startAt: integer('start_at', { mode: 'timestamp' })
		.default(sql`(unixepoch())`)
		.notNull(),
	correctAnswer: integer('correct_answer').default(0).notNull(),
	score: real('score').default(0),
	finishAt: integer('finish_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.default(sql`(unixepoch())`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.default(sql`(unixepoch())`)
		.$onUpdate(() => new Date())
		.notNull()
});
export const assignmentRelations = relations(assignments, ({ one, many }) => ({
	user: one(users, {
		fields: [assignments.userId],
		references: [users.id]
	}),
	exam: one(exams, {
		fields: [assignments.examId],
		references: [exams.id]
	}),
	answers: many(answers)
}));
