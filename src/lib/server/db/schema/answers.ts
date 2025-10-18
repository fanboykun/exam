import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';
import { questions } from './questions';
import { assignments } from './assignments';
import { choises } from './choises';

export const answers = sqliteTable(
	'answers',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		assignmentId: text('assignment_id')
			.notNull()
			.references(() => assignments.id, { onDelete: 'cascade' }),
		questionId: text('question_id')
			.notNull()
			.references(() => questions.id, { onDelete: 'cascade' }),
		choiceId: text('choice_id')
			.notNull()
			.references(() => choises.id, { onDelete: 'cascade' }),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.default(sql`(unixepoch())`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.default(sql`(unixepoch())`)
			.$onUpdate(() => new Date())
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
