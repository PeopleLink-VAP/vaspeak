/**
 * Email sending utilities using Resend.
 *
 * All transactional emails for VASpeak:
 * - Email verification (signup)
 * - Magic link login
 * - Password reset
 * - Newsletter welcome
 * - Newsletter unsubscribe confirmation
 *
 * Uses VAP branding: Navy #1B365D, Sunflower #F2A906, Warm White #FFFBF1
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

// ─── Shared Email Layout ────────────────────────────────────────────────────

/**
 * Wraps email content in a branded layout shell.
 * Uses inline styles only — email clients don't support <style> blocks reliably.
 */
function emailLayout(content: string, footerNote?: string): string {
  const siteUrl = getSiteUrl();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VASpeak</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFBF1; font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFFBF1;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <!-- Inner card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 20px rgba(27, 54, 93, 0.12); overflow: hidden;">
          <!-- Header bar -->
          <tr>
            <td style="background-color: #1B365D; padding: 28px 32px; text-align: center;">
              <a href="${siteUrl}" style="text-decoration: none;">
                <span style="font-family: 'Plus Jakarta Sans', 'Farro', sans-serif; font-size: 28px; font-weight: 700; color: #FFFBF1; letter-spacing: -0.5px;">VA</span><span style="font-family: 'Plus Jakarta Sans', 'Farro', sans-serif; font-size: 28px; font-weight: 700; color: #F2A906; letter-spacing: -0.5px;">Speak</span>
              </a>
              <p style="margin: 8px 0 0; font-size: 13px; color: #FFFBF1CC; letter-spacing: 0.5px;">English Confidence Trainer</p>
            </td>
          </tr>
          <!-- Body content -->
          <tr>
            <td style="padding: 36px 32px 28px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top: 1px solid #1B365D15; padding-top: 20px;">
                    ${footerNote ? `<p style="margin: 0 0 12px; font-size: 12px; color: #1B365D80; line-height: 1.5;">${footerNote}</p>` : ''}
                    <p style="margin: 0; font-size: 12px; color: #1B365D60; line-height: 1.5;">
                      <a href="${siteUrl}" style="color: #8A491B; text-decoration: none;">VASpeak</a> · Part of <a href="https://virtualassistantpro.vn" style="color: #8A491B; text-decoration: none;">Virtual Assistant PRO</a>
                    </p>
                    <p style="margin: 6px 0 0; font-size: 11px; color: #1B365D40;">
                      eskills.virtualassistanpro.vn
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Generates a branded CTA button (sunflower gold with navy text). */
function ctaButton(text: string, href: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
  <tr>
    <td style="background-color: #F2A906; border-radius: 6px; box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);">
      <a href="${href}" target="_blank" style="display: inline-block; padding: 14px 36px; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 600; color: #1B365D; text-decoration: none; letter-spacing: 0.3px;">${text}</a>
    </td>
  </tr>
</table>`;
}

/** Heading style consistent across all emails. */
function heading(text: string): string {
  return `<h1 style="margin: 0 0 16px; font-family: 'Plus Jakarta Sans', 'Farro', sans-serif; font-size: 24px; font-weight: 700; color: #1B365D; line-height: 1.3;">${text}</h1>`;
}

/** Body paragraph. */
function paragraph(text: string): string {
  return `<p style="margin: 0 0 16px; font-size: 15px; color: #1B365DCC; line-height: 1.7;">${text}</p>`;
}

/** Secondary text for fallback links, expiry notes, etc. */
function muted(text: string): string {
  return `<p style="margin: 0; font-size: 13px; color: #1B365D80; line-height: 1.6;">${text}</p>`;
}

/** Fallback URL block. */
function fallbackLink(url: string): string {
  return `
<div style="margin-top: 20px;">
  ${muted('Or copy and paste this link into your browser:')}
  <p style="margin: 6px 0 0; font-size: 12px; word-break: break-all;">
    <a href="${url}" style="color: #8A491B; text-decoration: underline;">${url}</a>
  </p>
</div>`;
}

// ─── Email Verification ─────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verifyUrl = `${getSiteUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  const content = `
      ${heading('Welcome to VASpeak! 🎙️')}
      ${paragraph("You're one step away from building your English speaking confidence. Verify your email to get started.")}
      ${ctaButton('Verify My Email', verifyUrl)}
      ${fallbackLink(verifyUrl)}
    `;

  await sendEmail({
    to: email,
    subject: '✉️ Verify your email — VASpeak',
    html: emailLayout(content, 'This link expires in 24 hours. If you did not create a VASpeak account, you can safely ignore this email.'),
    });
}

// ─── Magic Link ─────────────────────────────────────────────────────────────

export async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  const loginUrl = `${getSiteUrl()}/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`;

  const content = `
      ${heading('Your Magic Login Link 🔗')}
      ${paragraph('Click the button below to sign in instantly — no password needed.')}
      ${ctaButton('Sign In to VASpeak', loginUrl)}
      ${fallbackLink(loginUrl)}
    `;

  await sendEmail({
    to: email,
    subject: '🔐 Your VASpeak login link',
    html: emailLayout(content, 'This link expires in 15 minutes and can only be used once. If you did not request this, ignore this email.'),
    });
}

// ─── Password Reset ─────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${getSiteUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  const content = `
      ${heading('Reset Your Password 🔑')}
      ${paragraph('We received a request to reset your VASpeak password. Click the button below to choose a new one.')}
      ${ctaButton('Reset Password', resetUrl)}
      ${fallbackLink(resetUrl)}
    `;

  await sendEmail({
    to: email,
    subject: '🔑 Reset your VASpeak password',
    html: emailLayout(content, 'This link expires in 1 hour. If you did not request a password reset, your account is safe — just ignore this email.'),
    });
}

// ─── Newsletter Welcome ─────────────────────────────────────────────────────

export async function sendNewsletterWelcomeEmail(email: string): Promise<void> {
  const siteUrl = getSiteUrl();
  const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;

  const content = `
      ${heading("You're In! 🎉")}
      ${paragraph("Welcome to the VASpeak newsletter. Every week, you'll receive tips on building your English speaking confidence — practical techniques, phrases, and guidance tailored for Virtual Assistants.")}
      ${paragraph('<strong style="color: #1B365D;">Here\'s what to expect:</strong>')}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #1B365DCC; line-height: 1.6;">
            <span style="color: #F2A906; font-weight: 700; margin-right: 8px;">✦</span> Weekly confidence-building tips
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #1B365DCC; line-height: 1.6;">
            <span style="color: #F2A906; font-weight: 700; margin-right: 8px;">✦</span> Real-world phrases for client calls
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #1B365DCC; line-height: 1.6;">
            <span style="color: #F2A906; font-weight: 700; margin-right: 8px;">✦</span> Progress strategies and motivation
          </td>
        </tr>
      </table>
      ${ctaButton('Start Learning', siteUrl)}
    `;

  await sendEmail({
    to: email,
    subject: '🎉 Welcome to VASpeak — your confidence journey starts now',
    html: emailLayout(content, `You're receiving this because you subscribed at VASpeak. <a href="${unsubscribeUrl}" style="color: #8A491B; text-decoration: underline;">Unsubscribe</a>`),
  });
}

// ─── Newsletter Unsubscribe Confirmation ────────────────────────────────────

export async function sendUnsubscribeConfirmationEmail(email: string): Promise<void> {
  const siteUrl = getSiteUrl();
  const resubscribeUrl = `${siteUrl}/api/newsletter/subscribe?email=${encodeURIComponent(email)}`;

  const content = `
      ${heading("You have Been Unsubscribed")}
      ${paragraph("You won't receive any more newsletter emails from VASpeak. We're sorry to see you go.")}
      ${paragraph('Changed your mind? You can re-subscribe anytime.')}
      ${ctaButton('Re-subscribe', resubscribeUrl)}
    `;

  await sendEmail({
    to: email,
    subject: 'You have been unsubscribed from VASpeak',
        html: emailLayout(content),
  });
}
