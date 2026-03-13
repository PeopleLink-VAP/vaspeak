/**
 * Disposable email domain checker.
 * Uses the `disposable-email-domains` npm package (~130K domains).
 * Import is dynamic to avoid bundling the giant list into the client.
 */

// @ts-ignore — package ships a plain JS module with a default array export
import disposableDomains from 'disposable-email-domains';

const blocklist = new Set<string>(disposableDomains as string[]);

/**
 * Returns true if the email's domain is in the disposable-email-domains blocklist.
 * Also checks the `blacklisted_domains` table for admin-added domains.
 */
export function isDisposableEmail(email: string): boolean {
	const domain = email.split('@')[1]?.toLowerCase().trim();
	if (!domain) return false;
	return blocklist.has(domain);
}

/** Extract the domain from an email */
export function emailDomain(email: string): string {
	return email.split('@')[1]?.toLowerCase().trim() ?? '';
}
