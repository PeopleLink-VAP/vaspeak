/**
 * Email sending utilities using Resend.
 *
 * Rendering logic lives in email-templates.ts (pure, testable).
 * This module handles env access and the Resend API call.
 */

import { RESEND_API_KEY } from '$env/static/private';
import { env } from '$env/dynamic/private';
import {
  renderVerificationEmail,
  renderMagicLinkEmail,
  renderPasswordResetEmail,
  renderNewsletterWelcomeEmail,
  renderUnsubscribeEmail,
} from './email-templates';

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

// ─── Public API ─────────────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const { subject, html } = renderVerificationEmail(getSiteUrl(), token);
  await sendEmail({ to: email, subject, html });
}

export async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  const { subject, html } = renderMagicLinkEmail(getSiteUrl(), token);
  await sendEmail({ to: email, subject, html });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const { subject, html } = renderPasswordResetEmail(getSiteUrl(), token);
  await sendEmail({ to: email, subject, html });
}

export async function sendNewsletterWelcomeEmail(email: string): Promise<void> {
  const { subject, html } = renderNewsletterWelcomeEmail(getSiteUrl(), email);
  await sendEmail({ to: email, subject, html });
}

export async function sendUnsubscribeConfirmationEmail(email: string): Promise<void> {
  const { subject, html } = renderUnsubscribeEmail(getSiteUrl(), email);
  await sendEmail({ to: email, subject, html });
}
