import { relations } from 'drizzle-orm';
import { pgTable, text, uuid, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { questions } from './questions';
import { assignments } from './assignments';

export const exams = pgTable('exams', {
	id: uuid('id').primaryKey(),
	title: text('title').notNull(),
	duration: integer('duration'), // null means unlimited duration
	shouldRandomizeQuestions: boolean('should_randomize_questions').default(false).notNull(),
	description: text('description'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$defaultFn(() => new Date())
		.notNull()
});

export const examRelations = relations(exams, ({ many }) => ({
	questions: many(questions),
	assignments: many(assignments)
}));
