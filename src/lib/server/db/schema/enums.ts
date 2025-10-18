// SQLite doesn't have native enums, using text with check constraint
export const userRoleEnum = ['user', 'admin'] as const;
export type UserRole = (typeof userRoleEnum)[number];
