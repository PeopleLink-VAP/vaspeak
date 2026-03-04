/**
 * Email sending utilities using Resend.
 *
 * Sends transactional emails for:
 * - Email verification after signup
 * - Magic link login
 * - Password reset
 */

import { RESEND_API_KEY } from '$env/static/private';
import { env } from '$env/dynamic/private';

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_EMAIL = 'VASpeak <noreply@eskills.virtualassistanpro.vn>';

function getSiteUrl(): string {
    return env.SITE_URL || 'http://localhost:5173';
}

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
    const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: FROM_EMAIL,
            to: [to],
            subject,
            html,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error(`[Email] Failed to send to ${to}:`, error);
        throw new Error(`Failed to send email: ${response.status}`);
    }
}

// ─── Verification Email ─────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${getSiteUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

    await sendEmail({
        to: email,
        subject: 'Verify your VASpeak email',
        html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="color: #196376; font-size: 24px; margin-bottom: 16px;">Welcome to VASpeak! 🎙️</h1>
        <p style="color: #171C26; font-size: 16px; line-height: 1.6;">
          Thanks for signing up. Please verify your email address by clicking the button below.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #196376, #307E91); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; margin: 24px 0;">
          Verify Email
        </a>
        <p style="color: #6A7181; font-size: 14px; line-height: 1.5;">
          Or copy this link into your browser:<br>
          <a href="${verifyUrl}" style="color: #196376;">${verifyUrl}</a>
        </p>
        <p style="color: #6A7181; font-size: 13px; margin-top: 32px;">
          This link expires in 24 hours. If you didn't sign up for VASpeak, you can safely ignore this email.
        </p>
      </div>
    `,
    });
}

// ─── Magic Link Email ───────────────────────────────────────────────────────

export async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
    const loginUrl = `${getSiteUrl()}/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`;

    await sendEmail({
        to: email,
        subject: 'Your VASpeak login link',
        html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="color: #196376; font-size: 24px; margin-bottom: 16px;">Sign in to VASpeak 🔐</h1>
        <p style="color: #171C26; font-size: 16px; line-height: 1.6;">
          Click the button below to sign in. No password needed!
        </p>
        <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #196376, #307E91); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; margin: 24px 0;">
          Sign In
        </a>
        <p style="color: #6A7181; font-size: 14px; line-height: 1.5;">
          Or copy this link into your browser:<br>
          <a href="${loginUrl}" style="color: #196376;">${loginUrl}</a>
        </p>
        <p style="color: #6A7181; font-size: 13px; margin-top: 32px;">
          This link expires in 15 minutes and can only be used once. If you didn't request this, you can safely ignore it.
        </p>
      </div>
    `,
    });
}

// ─── Password Reset Email ───────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${getSiteUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;

    await sendEmail({
        to: email,
        subject: 'Reset your VASpeak password',
        html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="color: #196376; font-size: 24px; margin-bottom: 16px;">Reset Your Password 🔑</h1>
        <p style="color: #171C26; font-size: 16px; line-height: 1.6;">
          We received a request to reset your password. Click the button below to set a new one.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #196376, #307E91); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; margin: 24px 0;">
          Reset Password
        </a>
        <p style="color: #6A7181; font-size: 14px; line-height: 1.5;">
          Or copy this link into your browser:<br>
          <a href="${resetUrl}" style="color: #196376;">${resetUrl}</a>
        </p>
        <p style="color: #6A7181; font-size: 13px; margin-top: 32px;">
          This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
    });
}
