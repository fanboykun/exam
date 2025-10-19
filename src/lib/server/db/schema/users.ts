import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { userRoleEnum } from './enums';
import { relations } from 'drizzle-orm';
import { assignments } from './assignments';

export const users = sqliteTable(
	'users',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		email: text('email').notNull().unique(),
		image: text('image'),
		name: text('name').notNull(),
		provider: text('provider').notNull(),
		userRole: text('user_role', { enum: userRoleEnum }).default('user').notNull(),
		password: text('password'),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.default(sql`(unixepoch())`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.default(sql`(unixepoch())`)
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [index('provider_idx').on(table.provider), index('user_role_idx').on(table.userRole)]
);
export const userRelations = relations(users, ({ many }) => ({
	assignments: many(assignments)
}));
