import { pgTable, text, uuid, timestamp, integer } from 'drizzle-orm/pg-core';
import { exams } from './exams';
import { relations } from 'drizzle-orm';
import { choises } from './choises';

export const questions = pgTable('questions', {
	id: uuid('id').primaryKey().defaultRandom(),
	number: integer('number').notNull(),
	examId: uuid('exam_id')
		.notNull()
		.references(() => exams.id, { onDelete: 'cascade' }),
	content: text('content').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$defaultFn(() => new Date())
		.notNull()
});
export const questionRelations = relations(questions, ({ one, many }) => ({
	exam: one(exams, {
		fields: [questions.examId],
		references: [exams.id]
	}),
	choises: many(choises)
}));
