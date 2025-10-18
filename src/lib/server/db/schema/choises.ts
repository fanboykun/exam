import { pgTable, text, uuid, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { questions } from './questions';
export const choises = pgTable('choices', {
	id: uuid('id').primaryKey().defaultRandom(),
	questionId: uuid('question_id')
		.notNull()
		.references(() => questions.id, { onDelete: 'cascade' }),
	position: integer('position').notNull(), // ordering
	content: text('content').notNull(),
	isCorrect: boolean('is_correct').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$defaultFn(() => new Date())
		.notNull()
});

export const choiseRelations = relations(choises, ({ one }) => ({
	question: one(questions, {
		fields: [choises.questionId],
		references: [questions.id]
	})
}));
