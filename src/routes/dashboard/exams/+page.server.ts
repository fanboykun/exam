import type { PageServerLoad } from './$types';
import { ensureAuthenticated } from '$lib/server/middlewares/ensure-authenticated';
import { db } from '$lib/server/db';

export const load: PageServerLoad = ensureAuthenticated(async () => {
	const exams = await db.query.exams.findMany();
	return { exams };
});
