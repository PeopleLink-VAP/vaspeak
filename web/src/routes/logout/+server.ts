import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SESSION_COOKIE, cookieOptions } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies }) => {
	cookies.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 });
	throw redirect(302, '/login');
};
