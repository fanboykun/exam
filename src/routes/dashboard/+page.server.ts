import type { PageServerLoad } from './$types';
import { ensureAuthenticated } from '$lib/server/middlewares/ensure-authenticated';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = ensureAuthenticated(async () => {
	redirect(302, '/dashboard/exams');
});
