import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	createPasswordResetToken,
	consumePasswordResetToken,
	verifyPasswordResetToken
} from '$lib/server/password-reset';
import { hashPassword, SESSION_COOKIE, cookieOptions, signToken, findUserByEmail } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { passwordResetEmail, sendEmail } from '$lib/server/email';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (locals.user) throw redirect(302, '/dashboard');

	const token = url.searchParams.get('token') ?? '';
	if (!token) return { mode: 'request' as const };

	// Validate the token (without consuming it)
	const payload = await verifyPasswordResetToken(token);
	if (!payload) {
		return { mode: 'invalid' as const };
	}

	return { mode: 'reset' as const, token, email: payload.email };
};

export const actions: Actions = {
	// ── Step 1: Request a reset link ────────────────────────────────
	request: async ({ request, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, { action: 'request', error: 'Vui lòng nhập địa chỉ email hợp lệ.' });
		}

		// Generate token (returns null if email not registered — we don't reveal this)
		const token = await createPasswordResetToken(email);

		if (token) {
			const origin = PUBLIC_BASE_URL || `${url.protocol}//${url.host}`;
			const link = `${origin}/auth/reset-password?token=${token}`;
			const emailData = passwordResetEmail({ to: email, link, expiryHours: 1 });
			await sendEmail(emailData);
		}

		// Always return success — never reveal whether email is registered
		return {
			action: 'request',
			success: true,
			message: `Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu tới ${email} nếu đó là tài khoản đã đăng ký. Kiểm tra hộp thư (và thư mục spam) nhé!`
		};
	},

	// ── Step 2: Set new password ─────────────────────────────────────
	reset: async ({ request, cookies }) => {
		const form = await request.formData();
		const token = String(form.get('token') ?? '');
		const password = String(form.get('password') ?? '');
		const confirmPassword = String(form.get('confirm_password') ?? '');

		if (!token) {
			return fail(400, { action: 'reset', error: 'Token không hợp lệ.' });
		}
		if (password.length < 8) {
			return fail(400, { action: 'reset', error: 'Mật khẩu phải có ít nhất 8 ký tự.' });
		}
		if (password !== confirmPassword) {
			return fail(400, { action: 'reset', error: 'Mật khẩu xác nhận không khớp.' });
		}

		const payload = await consumePasswordResetToken(token);
		if (!payload) {
			return fail(400, {
				action: 'reset',
				error: 'Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu link mới.'
			});
		}

		// Update password
		const passwordHash = await hashPassword(password);
		await db.execute({
			sql: `INSERT INTO auth_passwords (user_id, password_hash) VALUES (?, ?)
			      ON CONFLICT(user_id) DO UPDATE SET password_hash = excluded.password_hash`,
			args: [payload.userId, passwordHash]
		});

		// Auto-login
		const userRow = await findUserByEmail(payload.email);
		if (userRow) {
			const sessionToken = signToken({
				id: String(userRow.id),
				email: String(userRow.email),
				displayName: userRow.display_name ? String(userRow.display_name) : null,
				role: String(userRow.role ?? 'user')
			});
			cookies.set(SESSION_COOKIE, sessionToken, cookieOptions);
		}

		throw redirect(302, '/dashboard?reset=1');
	}
};
