import { defineConfig } from 'drizzle-kit';

function getCredentials() {
	if (process.env.NODE_ENV === 'production') {
		if (
			(!process.env.DATABASE_URL && !process.env.TURSO_DATABASE_URL) ||
			!process.env.TURSO_AUTH_TOKEN
		) {
			throw new Error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables');
		}
		return {
			url: process.env.DATABASE_URL! || process.env.TURSO_DATABASE_URL!,
			authToken: process.env.TURSO_AUTH_TOKEN
		};
	}
	return {
		url: process.env.DATABASE_URL?.replace('file:', '') || './.data/database.sqlite'
	};
}
export default defineConfig({
	schema: './src/lib/server/db/schema/index.ts',
	dialect: 'turso',
	dbCredentials: getCredentials(),
	verbose: true,
	strict: true,
	casing: 'snake_case'
});
