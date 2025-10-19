import { command, getRequestEvent } from '$app/server';
import { z } from 'zod/v4';
import { auth } from '$lib/server/auth';
import { dev } from '$app/environment';
import { Models } from '$lib/server/db/models';
import { RemoteResponse } from '$lib/shared/utils/remote-response';

export const handleMockLogin = command(
	z.object({
		name: z.string().min(4).max(255),
		email: z.email(),
		state: z.string().optional()
	}),
	async ({ name, email, state }) => {
		const { locals, cookies, getClientAddress, request } = getRequestEvent();

		if (locals.user) {
			return RemoteResponse.go({ location: '/', message: 'User already logged in' });
		}
		if (!dev || process.env.NODE_ENV === 'production') {
			return RemoteResponse.failure({ message: 'Mock login is disabled', error: {} });
		}

		const accessToken = crypto.randomUUID();
		const user = await new Models.User().upsertByEmail({
			name,
			email,
			provider: 'google',
			accessToken
		});
		if (!user) return RemoteResponse.failure({ message: 'Failed to create user', error: {} });

		const setSessionResult = await auth.session.setSession({
			cookies: cookies,
			sessionId: accessToken,
			data: {
				userId: user.id,
				ipAddress: getClientAddress() || '0.0.0.0',
				userAgent: request.headers.get('user-agent') || 'Unknown'
			}
		});
		if (!setSessionResult)
			return RemoteResponse.failure({ message: 'Failed to set session', error: {} });

		const searchParams = new URLSearchParams(state);
		const redirectTo = searchParams.get('redirectTo') || '/';
		return RemoteResponse.go({
			location: redirectTo.startsWith('/') ? redirectTo : '/',
			message: 'User logged in successfully'
		});
	}
);

export const handleLogout = command(async () => {
	const { locals, cookies } = getRequestEvent();
	if (!locals.user) return RemoteResponse.failure({ message: 'User not found', error: {} });
	await auth.session.deleteSession({ cookies });
	return RemoteResponse.success({ message: 'User logged out successfully', data: {} });
});

export const handleProviderLogin = command(
	z.object({
		state: z.string().optional(),
		provider: z.enum(auth.getAvailableProviders())
	}),
	async ({ state, provider }) => {
		const { cookies, url, locals } = getRequestEvent();
		if (locals.user) {
			return RemoteResponse.failure({ message: 'User already logged in', error: {} });
		}
		const callbackUri = `${url.origin}/auth/callback/${provider}`;
		const authenticationUrl = auth.getAuthenticationUrl(provider, {
			cookie: cookies,
			redirectUri: callbackUri,
			state
		});
		return RemoteResponse.go({ location: authenticationUrl.toString(), message: 'Redirecting' });
	}
);
