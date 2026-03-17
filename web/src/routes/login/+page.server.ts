import { fail, redirect } from '@sveltejs/kit';
import { randomBytes } from 'crypto';
import type { Actions, PageServerLoad } from './$types';
import {
	findUserByEmail,
	createUser,
	hashPassword,
	verifyPassword,
	signToken,
	SESSION_COOKIE,
	cookieOptions
} from '$lib/server/auth';
import { createMagicLink } from '$lib/server/magic-link';
import { sendEmail, magicLinkEmail, verificationEmail } from '$lib/server/email';
import { createVerificationToken, VERIFICATION_EXPIRY_MINUTES } from '$lib/server/verify-email';
import { isDisposableEmail } from '$lib/server/disposable';
import { PUBLIC_BASE_URL } from '$env/static/public';

const MAGIC_EXPIRY = 15; // minutes

// Already logged in → go to dashboard
export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(302, '/dashboard');
	return {};
};

export const actions: Actions = {
	// ── LOGIN ─────────────────────────────────────────────────────────────────
	login: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const password = String(form.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { action: 'login', error: 'Email and password are required.' });
		}

		const row = await findUserByEmail(email);

		if (!row || !row.password_hash) {
			return fail(401, { action: 'login', error: 'Invalid email or password.' });
		}

		const ok = await verifyPassword(password, String(row.password_hash));
		if (!ok) {
			return fail(401, { action: 'login', error: 'Invalid email or password.' });
		}

		// Enforce email verification — unverified users must use magic link
		if (!row.email_verified) {
			return fail(403, {
				action: 'login',
				error: 'Please verify your email before logging in. Check your inbox or use the magic link option.'
			});
		}

		const token = signToken({
			id: String(row.id),
			email: String(row.email),
			displayName: row.display_name ? String(row.display_name) : null,
			role: String(row.role ?? 'user')
		});

		cookies.set(SESSION_COOKIE, token, cookieOptions);
		throw redirect(302, '/dashboard');
	},

	// ── REGISTER ──────────────────────────────────────────────────────────────
	register: async ({ request, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const password = String(form.get('password') ?? '');
		const displayName = String(form.get('display_name') ?? '').trim();

		// Validation
		if (!email || !password || !displayName) {
			return fail(400, { action: 'register', error: 'Vui lòng điền đầy đủ tất cả các trường.' });
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, { action: 'register', error: 'Địa chỉ email không hợp lệ.' });
		}
		if (password.length < 8) {
			return fail(400, { action: 'register', error: 'Mật khẩu phải có ít nhất 8 ký tự.' });
		}

		// Block disposable email providers
		if (isDisposableEmail(email)) {
			return fail(400, {
				action: 'register',
				error: 'Email tạm thời hoặc dùng một lần không được chấp nhận. Vui lòng dùng email thật.'
			});
		}

		// Check for existing account
		const existing = await findUserByEmail(email);
		if (existing) {
			// Anti-enumeration: same message whether verified or not
			return fail(409, {
				action: 'register',
				error: 'Email này đã có tài khoản. Hãy đăng nhập hoặc dùng magic link thay thế.'
			});
		}

		const id = randomBytes(8).toString('hex');
		const passwordHash = await hashPassword(password);

		try {
			await createUser({ id, email, displayName, passwordHash });
		} catch (err: any) {
			console.error('[register] DB error:', err);
			// Catch UNIQUE constraint — email was registered between our check and insert (race)
			const msg = String(err?.message ?? '');
			if (msg.includes('UNIQUE') || msg.includes('unique') || msg.includes('already exists')) {
				return fail(409, {
					action: 'register',
					error: 'Email này đã có tài khoản. Hãy đăng nhập hoặc dùng magic link.'
				});
			}
			return fail(500, { action: 'register', error: 'Đăng ký thất bại. Vui lòng thử lại sau.' });
		}

		// Send verification email (fire-and-forget)
		try {
			const verifyToken = await createVerificationToken(id, email);
			const origin = PUBLIC_BASE_URL || `${url.protocol}//${url.host}`;
			const verifyLink = `${origin}/auth/verify-email?token=${verifyToken}`;
			const emailData = verificationEmail({
				to: email,
				link: verifyLink,
				code: verifyToken.slice(0, 6).toUpperCase(),
				expiryMinutes: VERIFICATION_EXPIRY_MINUTES
			});
			await sendEmail(emailData);
		} catch (err) {
			console.error('[register] Failed to send verification email:', err);
			// Don't fail registration — user can use magic link to verify
		}

		return {
			action: 'register',
			success: true,
			message: `Tài khoản đã tạo thành công! Chúng tôi đã gửi link xác thực tới ${email}. Nhấp vào link để kích hoạt tài khoản và đăng nhập.`
		};
	},

	// ── MAGIC LINK ────────────────────────────────────────────────────────────
	magic: async ({ request, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, { action: 'magic', error: 'Vui lòng nhập địa chỉ email hợp lệ.' });
		}

		// Generate token (returns null if email not registered — we don't reveal this)
		const token = await createMagicLink(email);

		// Send email only if user exists — silently skip if not
		if (token) {
			const origin = PUBLIC_BASE_URL || `${url.protocol}//${url.host}`;
			const link = `${origin}/auth/magic?token=${token}`;
			const emailData = magicLinkEmail({ to: email, link, expiryMinutes: MAGIC_EXPIRY });
			await sendEmail(emailData);
		}

		// Always return success — never reveal whether email is registered
		return {
			action: 'magic',
			success: true,
			message: `Chúng tôi đã gửi link đăng nhập tới ${email} nếu địa chỉ này đã được đăng ký. Kiểm tra hộp thư (và thư mục spam) của bạn!`
		};
	}
};
