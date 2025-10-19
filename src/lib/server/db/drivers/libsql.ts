import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../schema';

function getCredentials() {
	if (process.env.NODE_ENV === 'production') {
		console.log(process.env);
		if (
			(!process.env.DATABASE_URL && !process.env.TURSO_DATABASE_URL) ||
			!process.env.TURSO_AUTH_TOKEN
		) {
			throw new Error(
				'Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables in driver'
			);
		}
		return {
			url: process.env.DATABASE_URL! || process.env.TURSO_DATABASE_URL!,
			authToken: process.env.TURSO_AUTH_TOKEN
		};
	}
	return {
		url: process.env.DATABASE_URL || 'file:./.data/database.sqlite'
	};
}

export function createDatabase() {
	return drizzle({
		connection: getCredentials(),
		schema
	});
}
