import { relations, sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { questions } from './questions';
import { assignments } from './assignments';

export const exams = sqliteTable('exams', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	duration: integer('duration'), // null means unlimited duration
	shouldRandomizeQuestions: integer('should_randomize_questions', { mode: 'boolean' })
		.default(false)
		.notNull(),
	description: text('description'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.default(sql`(unixepoch())`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.default(sql`(unixepoch())`)
		.$onUpdate(() => new Date())
		.notNull()
});

export const examRelations = relations(exams, ({ many }) => ({
	questions: many(questions),
	assignments: many(assignments)
}));
