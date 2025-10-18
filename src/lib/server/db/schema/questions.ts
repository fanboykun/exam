import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { exams } from './exams';
import { relations } from 'drizzle-orm';
import { choises } from './choises';

export const questions = sqliteTable('questions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	number: integer('number').notNull(),
	examId: text('exam_id')
		.notNull()
		.references(() => exams.id, { onDelete: 'cascade' }),
	content: text('content').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.default(sql`(unixepoch())`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.default(sql`(unixepoch())`)
		.$onUpdate(() => new Date())
		.notNull()
});
export const questionRelations = relations(questions, ({ one, many }) => ({
	exam: one(exams, {
		fields: [questions.examId],
		references: [exams.id]
	}),
	choises: many(choises)
}));
