/**
 * Email Preview Generator
 *
 * Run: npx tsx scripts/preview-emails.ts
 *
 * Generates one HTML file per email template in /tmp/email-previews/.
 * Open them in a browser to visually verify the design.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
    renderVerificationEmail,
    renderMagicLinkEmail,
    renderPasswordResetEmail,
    renderNewsletterWelcomeEmail,
    renderUnsubscribeEmail,
} from '../src/lib/server/email-templates';

const SITE = 'https://vaspeak.netlify.app';
const OUT_DIR = '/tmp/email-previews';

mkdirSync(OUT_DIR, { recursive: true });

const templates = [
    { name: 'verification', ...renderVerificationEmail(SITE, 'sample-token-abc123') },
    { name: 'magic-link', ...renderMagicLinkEmail(SITE, 'sample-magic-token') },
    { name: 'password-reset', ...renderPasswordResetEmail(SITE, 'sample-reset-token') },
    { name: 'newsletter-welcome', ...renderNewsletterWelcomeEmail(SITE, 'user@example.com') },
    { name: 'unsubscribe', ...renderUnsubscribeEmail(SITE, 'user@example.com') },
];

console.log(`\n📧 Generating email previews → ${OUT_DIR}/\n`);

for (const { name, subject, html } of templates) {
    const filename = `${name}.html`;
    const filepath = join(OUT_DIR, filename);
    writeFileSync(filepath, html, 'utf-8');
    console.log(`  ✅ ${filename}  — "${subject}"`);
}

console.log(`\n🎉 Done! Open these in a browser to preview.\n`);
console.log(`  open ${OUT_DIR}/verification.html`);
console.log(`  open ${OUT_DIR}/magic-link.html`);
console.log(`  open ${OUT_DIR}/password-reset.html`);
console.log(`  open ${OUT_DIR}/newsletter-welcome.html`);
console.log(`  open ${OUT_DIR}/unsubscribe.html\n`);
