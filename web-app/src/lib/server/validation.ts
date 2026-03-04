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

// @ts-ignore — disposable-email-domains ships as a JSON array, no types needed
import disposableDomains from 'disposable-email-domains';

/** Set of ~4,000+ known disposable email domains (community-maintained). */
const DISPOSABLE_DOMAINS: Set<string> = new Set(disposableDomains);

/**
 * Check if a domain belongs to a known disposable email provider.
 * Uses the `disposable-email-domains` npm package for comprehensive coverage.
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
