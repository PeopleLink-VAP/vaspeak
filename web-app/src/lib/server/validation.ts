/**
 * Input validation utilities for auth flows.
 *
 * Includes email format validation, password strength checks,
 * and disposable/blacklisted domain detection.
 */

// ─── Email Validation ───────────────────────────────────────────────────────

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Email is required' };
    }

    const trimmed = email.trim().toLowerCase();

    if (trimmed.length > 254) {
        return { valid: false, error: 'Email is too long' };
    }

    if (!EMAIL_REGEX.test(trimmed)) {
        return { valid: false, error: 'Invalid email format' };
    }

    return { valid: true };
}

// ─── Password Validation ────────────────────────────────────────────────────

export function validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password || typeof password !== 'string') {
        return { valid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
        return { valid: false, error: 'Password must be at least 8 characters' };
    }

    if (password.length > 128) {
        return { valid: false, error: 'Password is too long' };
    }

    if (!/[a-z]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one lowercase letter' };
    }

    if (!/[A-Z]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one uppercase letter' };
    }

    if (!/[0-9]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one number' };
    }

    return { valid: true };
}

// ─── Domain Extraction ──────────────────────────────────────────────────────

export function extractDomain(email: string): string {
    return email.split('@')[1]?.toLowerCase() ?? '';
}

// ─── Disposable Domain Check ────────────────────────────────────────────────

/**
 * Hardcoded list of well-known disposable email domains.
 * This provides a fast local check before hitting the database.
 */
const DISPOSABLE_DOMAINS = new Set([
    // Major disposable email providers
    'tempmail.com', 'throwaway.email', 'guerrillamail.com',
    'mailinator.com', 'yopmail.com', 'trashmail.com',
    'tempail.com', 'fakeinbox.com', 'sharklasers.com',
    'guerrillamailblock.com', 'grr.la', 'dispostable.com',
    'temp-mail.org', 'getnada.com', 'emailondeck.com',
    'maildrop.cc', 'harakirimail.com', 'tempmailo.com',
    'mohmal.com', 'burnermail.io',
    '10minutemail.com', 'minutemail.com', 'tempinbox.com',
    'mailnesia.com', 'mailcatch.com', 'mytemp.email',
    'throwawaymail.com', 'inboxbear.com', 'mailsac.com',
    'anonbox.net', 'jetable.org', 'spambox.us',
    'trashmail.ws', 'trashmail.me', 'trashmail.net',
    'getairmail.com', 'filzmail.com', 'tempr.email',
    'binkmail.com', 'safetymail.info', 'tempmailaddress.com',
    'tempsky.com', 'emailfake.com', 'crazymailing.com',
    'armyspy.com', 'dayrep.com', 'einrot.com',
    'fleckens.hu', 'gustr.com', 'jourrapide.com',
    'rhyta.com', 'superrito.com', 'teleworm.us',
    // More common ones
    'disposableemailaddresses.emailmiser.com',
    'guerrillamail.info', 'guerrillamail.net', 'guerrillamail.org',
    'guerrillamail.de', 'guerrillamailblock.com',
    'temp-mail.io', 'tempmailer.com', 'tempmails.com',
    'throwam.com', 'trash-mail.com', 'tmail.ws',
    'yomail.info', 'boun.cr', 'mailexpire.com',
    'mailforspam.com', 'mailmoat.com', 'mailnull.com',
    'meltmail.com', 'mintemail.com', 'mt2015.com',
    'nobulk.com', 'nospamfor.us', 'nowmymail.com',
    'spamfree24.org', 'spamgourmet.com', 'spamhole.com',
    'thankyou2010.com', 'wegwerfmail.de', 'wegwerfmail.net',
]);

/**
 * Check if a domain belongs to a known disposable email provider.
 * Fast, local-only check against hardcoded list.
 */
export function isDisposableDomain(domain: string): boolean {
    return DISPOSABLE_DOMAINS.has(domain.toLowerCase());
}

/**
 * Validate an email for registration — combines format validation
 * with disposable domain check.
 */
export function validateRegistrationEmail(email: string): { valid: boolean; error?: string } {
    const formatResult = validateEmail(email);
    if (!formatResult.valid) return formatResult;

    const domain = extractDomain(email);
    if (isDisposableDomain(domain)) {
        return { valid: false, error: 'Disposable email addresses are not allowed' };
    }

    return { valid: true };
}
