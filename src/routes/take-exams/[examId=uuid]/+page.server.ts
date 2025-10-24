import type { PageServerLoad } from './$types';
import { ensureAuthenticated } from '$lib/server/middlewares/ensure-authenticated';

export const load: PageServerLoad = ensureAuthenticated(async ({ params: { examId }, cookies }) => {
	const assignmentSession = cookies.get('exam_session');
	return {
		examId,
		assignmentSession
	};
});
