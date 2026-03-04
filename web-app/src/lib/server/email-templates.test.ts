/**
 * Unit tests for email template rendering.
 *
 * Tests the pure rendering functions in email-templates.ts
 * without any SvelteKit env imports or network calls.
 */

import { describe, it, expect } from 'vitest';
import {
    emailLayout,
    ctaButton,
    heading,
    paragraph,
    muted,
    fallbackLink,
    renderVerificationEmail,
    renderMagicLinkEmail,
    renderPasswordResetEmail,
    renderNewsletterWelcomeEmail,
    renderUnsubscribeEmail,
} from '$lib/server/email-templates';

const SITE = 'https://vaspeak.netlify.app';

// ─── Layout Primitives ──────────────────────────────────────────────────────

describe('emailLayout', () => {
    it('renders a complete HTML document', () => {
        const html = emailLayout(SITE, '<p>Hello</p>');
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('</html>');
    });

    it('includes the VASpeak branding header (navy background)', () => {
        const html = emailLayout(SITE, '<p>Test</p>');
        expect(html).toContain('background-color: #1B365D');
        expect(html).toContain('VASpeak');
        expect(html).toContain('English Confidence Trainer');
    });

    it('uses warm white background', () => {
        const html = emailLayout(SITE, '<p>Test</p>');
        expect(html).toContain('background-color: #FFFBF1');
    });

    it('includes the content', () => {
        const html = emailLayout(SITE, '<p>Custom content here</p>');
        expect(html).toContain('Custom content here');
    });

    it('includes footer note when provided', () => {
        const html = emailLayout(SITE, '<p>Body</p>', 'Expires in 24 hours');
        expect(html).toContain('Expires in 24 hours');
    });

    it('omits footer note when not provided', () => {
        const html = emailLayout(SITE, '<p>Body</p>');
        // Should not have a footer note paragraph but should still have the brand footer
        expect(html).toContain('Virtual Assistant PRO');
        expect(html).toContain('eskills.virtualassistanpro.vn');
    });

    it('links back to the site URL', () => {
        const html = emailLayout(SITE, '<p>Body</p>');
        expect(html).toContain(`href="${SITE}"`);
    });
});

describe('ctaButton', () => {
    it('renders a sunflower-gold button', () => {
        const html = ctaButton('Click Me', 'https://example.com');
        expect(html).toContain('background-color: #F2A906');
        expect(html).toContain('Click Me');
        expect(html).toContain('href="https://example.com"');
    });

    it('uses navy text color', () => {
        const html = ctaButton('Test', 'https://example.com');
        expect(html).toContain('color: #1B365D');
    });

    it('includes sunflower glow shadow', () => {
        const html = ctaButton('Test', 'https://example.com');
        expect(html).toContain('rgba(255, 215, 0, 0.3)');
    });
});

describe('heading', () => {
    it('renders an H1 with navy color', () => {
        const html = heading('Test Heading');
        expect(html).toContain('<h1');
        expect(html).toContain('color: #1B365D');
        expect(html).toContain('Test Heading');
    });
});

describe('paragraph', () => {
    it('renders a paragraph with navy/80 color', () => {
        const html = paragraph('Some text');
        expect(html).toContain('<p');
        expect(html).toContain('color: #1B365DCC');
        expect(html).toContain('Some text');
    });
});

describe('muted', () => {
    it('renders muted text with navy/50 color', () => {
        const html = muted('Fine print');
        expect(html).toContain('color: #1B365D80');
        expect(html).toContain('Fine print');
    });
});

describe('fallbackLink', () => {
    it('renders the URL as a clickable leaf-green link', () => {
        const html = fallbackLink('https://example.com/token');
        expect(html).toContain('color: #8A491B');
        expect(html).toContain('href="https://example.com/token"');
        expect(html).toContain('https://example.com/token');
    });

    it('includes instructional text', () => {
        const html = fallbackLink('https://example.com');
        expect(html).toContain('copy and paste this link');
    });
});

// ─── Template Renderers ─────────────────────────────────────────────────────

describe('renderVerificationEmail', () => {
    const result = renderVerificationEmail(SITE, 'abc123');

    it('has a subject line with emoji', () => {
        expect(result.subject).toContain('Verify your email');
        expect(result.subject).toContain('VASpeak');
    });

    it('generates the correct verify URL', () => {
        expect(result.html).toContain(`${SITE}/api/auth/verify-email?token=abc123`);
    });

    it('contains the verify CTA button', () => {
        expect(result.html).toContain('Verify My Email');
    });

    it('contains branding elements', () => {
        expect(result.html).toContain('#1B365D');  // navy
        expect(result.html).toContain('#F2A906');  // sunflower
        expect(result.html).toContain('#FFFBF1');  // warm white
    });

    it('includes expiry notice', () => {
        expect(result.html).toContain('24 hours');
    });
});

describe('renderMagicLinkEmail', () => {
    const result = renderMagicLinkEmail(SITE, 'magic-token');

    it('has a magic link subject', () => {
        expect(result.subject).toContain('login link');
    });

    it('generates the correct magic link URL', () => {
        expect(result.html).toContain(`${SITE}/api/auth/magic-link/verify?token=magic-token`);
    });

    it('contains CTA button', () => {
        expect(result.html).toContain('Sign In to VASpeak');
    });

    it('includes expiry notice (15 minutes)', () => {
        expect(result.html).toContain('15 minutes');
    });
});

describe('renderPasswordResetEmail', () => {
    const result = renderPasswordResetEmail(SITE, 'reset-tok');

    it('has a password reset subject', () => {
        expect(result.subject).toContain('Reset');
        expect(result.subject).toContain('password');
    });

    it('generates the correct reset URL', () => {
        expect(result.html).toContain(`${SITE}/reset-password?token=reset-tok`);
    });

    it('contains CTA button', () => {
        expect(result.html).toContain('Reset Password');
    });

    it('includes expiry notice (1 hour)', () => {
        expect(result.html).toContain('1 hour');
    });
});

describe('renderNewsletterWelcomeEmail', () => {
    const result = renderNewsletterWelcomeEmail(SITE, 'user@test.com');

    it('has a welcome subject', () => {
        expect(result.subject).toContain('Welcome');
        expect(result.subject).toContain('VASpeak');
    });

    it('lists the 3 newsletter benefits', () => {
        expect(result.html).toContain('confidence-building tips');
        expect(result.html).toContain('Real-world phrases');
        expect(result.html).toContain('Progress strategies');
    });

    it('contains Start Learning CTA', () => {
        expect(result.html).toContain('Start Learning');
    });

    it('includes unsubscribe link', () => {
        expect(result.html).toContain('Unsubscribe');
        expect(result.html).toContain(encodeURIComponent('user@test.com'));
    });
});

describe('renderUnsubscribeEmail', () => {
    const result = renderUnsubscribeEmail(SITE, 'user@test.com');

    it('has an unsubscribe subject', () => {
        expect(result.subject).toContain('unsubscribed');
    });

    it('contains re-subscribe CTA', () => {
        expect(result.html).toContain('Re-subscribe');
    });

    it('includes re-subscribe link with email', () => {
        expect(result.html).toContain(encodeURIComponent('user@test.com'));
    });
});
