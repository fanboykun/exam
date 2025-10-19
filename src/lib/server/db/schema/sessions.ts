import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const sessions = sqliteTable(
	'sessions',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		ipAddress: text('ip_address').notNull(),
		userAgent: text('user_agent').notNull(),
		expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.default(sql`(unixepoch())`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.default(sql`(unixepoch())`)
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [index('user_idx').on(table.userId)]
);
export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
		relationName: 'user'
	})
}));
