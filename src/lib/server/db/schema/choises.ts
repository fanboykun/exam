import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';
import { questions } from './questions';
export const choises = sqliteTable('choices', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	questionId: text('question_id')
		.notNull()
		.references(() => questions.id, { onDelete: 'cascade' }),
	position: integer('position').notNull(), // ordering
	content: text('content').notNull(),
	isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.default(sql`(unixepoch())`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.default(sql`(unixepoch())`)
		.$onUpdate(() => new Date())
		.notNull()
});

export const choiseRelations = relations(choises, ({ one }) => ({
	question: one(questions, {
		fields: [choises.questionId],
		references: [questions.id]
	})
}));
