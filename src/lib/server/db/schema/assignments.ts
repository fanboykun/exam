import { pgTable, uuid, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { exams } from './exams';
import { answers } from './answers';

export const assignments = pgTable('assignments', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	examId: uuid('exam_id')
		.notNull()
		.references(() => exams.id, { onDelete: 'cascade' }),
	startAt: timestamp('start_at').defaultNow().notNull(),
	correctAnswer: integer('correct_answer').default(0).notNull(),
	finishAt: timestamp('finish_at'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$defaultFn(() => new Date())
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
