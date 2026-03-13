import { ADMIN_AUTH_USER, ADMIN_AUTH_PASSWORD } from '$env/static/private';
import { error, type Handle } from '@sveltejs/kit';
import { verifyToken, SESSION_COOKIE } from '$lib/server/auth';
import { authLimiter, magicLinkLimiter } from '$lib/server/rate-limit';

export const handle: Handle = async ({ event, resolve }) => {
	const ip = event.getClientAddress();

	// ── Admin basic-auth guard ────────────────────────────────────────────────
	if (event.url.pathname.startsWith('/admin')) {
		const auth = event.request.headers.get('authorization');

		if (!auth || !auth.startsWith('Basic ')) {
			return new Response('Unauthorized', {
				status: 401,
				headers: { 'WWW-Authenticate': 'Basic realm="VASpeak Admin"' }
			});
		}

		const decoded = atob(auth.slice(6));
		const [user, pass] = decoded.split(':');

		if (user !== ADMIN_AUTH_USER || pass !== ADMIN_AUTH_PASSWORD) {
			return new Response('Forbidden', {
				status: 403,
				headers: { 'WWW-Authenticate': 'Basic realm="VASpeak Admin"' }
			});
		}
	}

	// ── Rate limiting for auth endpoints ─────────────────────────────────────
	if (event.request.method === 'POST') {
		if (event.url.pathname === '/login') {
			const action = event.url.searchParams.get('/');
			// Apply to login and register actions; magic link has its own limiter
			if (action === 'login' || action === 'register' || !action) {
				if (!authLimiter.allow(ip)) {
					return new Response(
						JSON.stringify({ error: 'Too many requests. Please try again later.' }),
						{ status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
					);
				}
			}
			if (action === 'magic') {
				if (!magicLinkLimiter.allow(ip)) {
					return new Response(
						JSON.stringify({ error: 'Too many requests. Please wait before requesting another link.' }),
						{ status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '600' } }
					);
				}
			}
		}
	}

	// ── Session JWT → event.locals.user ──────────────────────────────────────
	event.locals.user = null;
	const token = event.cookies.get(SESSION_COOKIE);
	if (token) {
		const payload = verifyToken(token);
		if (payload) {
			event.locals.user = {
				id: payload.sub,
				email: payload.email,
				displayName: payload.displayName,
				role: payload.role
			};
		}
	}

	return resolve(event);
};
