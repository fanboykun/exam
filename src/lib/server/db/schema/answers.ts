import { pgTable, uuid, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { questions } from './questions';
import { assignments } from './assignments';
import { choises } from './choises';

export const answers = pgTable(
	'answers',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		assignmentId: uuid('assignment_id')
			.notNull()
			.references(() => assignments.id, { onDelete: 'cascade' }),
		questionId: uuid('question_id')
			.notNull()
			.references(() => questions.id, { onDelete: 'cascade' }),
		choiceId: uuid('choice_id')
			.notNull()
			.references(() => choises.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$defaultFn(() => new Date())
			.notNull()
	},
	(table) => [unique().on(table.assignmentId, table.questionId, table.choiceId)]
);

export const answerRelations = relations(answers, ({ one }) => ({
	assignment: one(assignments, {
		fields: [answers.assignmentId],
		references: [assignments.id]
	}),
	question: one(questions, {
		fields: [answers.questionId],
		references: [questions.id]
	}),
	choice: one(choises, {
		fields: [answers.choiceId],
		references: [choises.id]
	})
}));
