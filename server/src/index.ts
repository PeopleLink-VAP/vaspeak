/**
 * VASpeak SpacetimeDB Module — Reducers
 *
 * All server-side reducers for auth, membership, newsletter.
 * Password hashing/verification happens in SvelteKit API routes,
 * NOT in these reducers. The reducers simply store/retrieve data.
 */

import spacetimedb, {
    User,
    EmailVerification,
    MagicLink,
    PasswordReset,
    NewsletterSubscriber,
    BlacklistedDomain,
} from './schema.js';

// ─── Auth Reducers ──────────────────────────────────────────────────────────

/**
 * Register a new user. Password is already hashed by the SvelteKit API route.
 */
spacetimedb.reducer('register_user', {
    email: spacetimedb.type.string(),
    passwordHash: spacetimedb.type.string(),
    verificationToken: spacetimedb.type.string(),
    tokenExpiresAt: spacetimedb.type.u64(),
}, (ctx, { email, passwordHash, verificationToken, tokenExpiresAt }) => {
    // Check if user already exists
    const existing = ctx.db.users.email.find(email);
    if (existing) {
        throw new Error('User with this email already exists');
    }

    const now = BigInt(Date.now());

    // Insert user
    const user = ctx.db.users.insert({
        id: 0n,
        email,
        passwordHash,
        emailVerified: false,
        role: 'user',
        createdAt: now,
        updatedAt: now,
    });

    // Create email verification token
    ctx.db.emailVerifications.insert({
        id: 0n,
        userId: user.id,
        token: verificationToken,
        expiresAt: tokenExpiresAt,
    });
});

/**
 * Verify a user's email address using the verification token.
 */
spacetimedb.reducer('verify_email', {
    token: spacetimedb.type.string(),
}, (ctx, { token }) => {
    const verification = ctx.db.emailVerifications.token.find(token);
    if (!verification) {
        throw new Error('Invalid verification token');
    }

    const now = BigInt(Date.now());
    if (verification.expiresAt < now) {
        // Clean up expired token
        ctx.db.emailVerifications.id.delete(verification.id);
        throw new Error('Verification token has expired');
    }

    // Mark user as verified
    const user = ctx.db.users.id.find(verification.userId);
    if (!user) {
        throw new Error('User not found');
    }

    ctx.db.users.id.update({
        ...user,
        emailVerified: true,
        updatedAt: now,
    });

    // Delete the verification token
    ctx.db.emailVerifications.id.delete(verification.id);
});

/**
 * Create a magic link token for passwordless login.
 */
spacetimedb.reducer('create_magic_link', {
    email: spacetimedb.type.string(),
    token: spacetimedb.type.string(),
    expiresAt: spacetimedb.type.u64(),
}, (ctx, { email, token, expiresAt }) => {
    ctx.db.magicLinks.insert({
        id: 0n,
        email,
        token,
        expiresAt,
        used: false,
    });
});

/**
 * Consume a magic link — marks it as used and returns success if valid.
 */
spacetimedb.reducer('consume_magic_link', {
    token: spacetimedb.type.string(),
}, (ctx, { token }) => {
    const link = ctx.db.magicLinks.token.find(token);
    if (!link) {
        throw new Error('Invalid magic link');
    }
    if (link.used) {
        throw new Error('Magic link already used');
    }

    const now = BigInt(Date.now());
    if (link.expiresAt < now) {
        throw new Error('Magic link has expired');
    }

    // Mark as used
    ctx.db.magicLinks.id.update({
        ...link,
        used: true,
    });

    // Ensure user exists and is verified (magic link acts as email verification)
    const user = ctx.db.users.email.find(link.email);
    if (user && !user.emailVerified) {
        ctx.db.users.id.update({
            ...user,
            emailVerified: true,
            updatedAt: now,
        });
    }
});

/**
 * Create a password reset token.
 */
spacetimedb.reducer('request_password_reset', {
    userId: spacetimedb.type.u64(),
    token: spacetimedb.type.string(),
    expiresAt: spacetimedb.type.u64(),
}, (ctx, { userId, token, expiresAt }) => {
    ctx.db.passwordResets.insert({
        id: 0n,
        userId,
        token,
        expiresAt,
        used: false,
    });
});

/**
 * Reset password using a valid reset token.
 * New password hash is computed by SvelteKit API route.
 */
spacetimedb.reducer('reset_password', {
    token: spacetimedb.type.string(),
    newPasswordHash: spacetimedb.type.string(),
}, (ctx, { token, newPasswordHash }) => {
    const reset = ctx.db.passwordResets.token.find(token);
    if (!reset) {
        throw new Error('Invalid reset token');
    }
    if (reset.used) {
        throw new Error('Reset token already used');
    }

    const now = BigInt(Date.now());
    if (reset.expiresAt < now) {
        throw new Error('Reset token has expired');
    }

    // Update the user's password
    const user = ctx.db.users.id.find(reset.userId);
    if (!user) {
        throw new Error('User not found');
    }

    ctx.db.users.id.update({
        ...user,
        passwordHash: newPasswordHash,
        updatedAt: now,
    });

    // Mark reset token as used
    ctx.db.passwordResets.id.update({
        ...reset,
        used: true,
    });
});

// ─── Newsletter Reducers ────────────────────────────────────────────────────

/**
 * Subscribe an email to the newsletter.
 */
spacetimedb.reducer('subscribe_newsletter', {
    email: spacetimedb.type.string(),
}, (ctx, { email }) => {
    const existing = ctx.db.newsletterSubscribers.email.find(email);
    if (existing) {
        // Re-subscribe if previously unsubscribed
        if (existing.unsubscribed) {
            ctx.db.newsletterSubscribers.id.update({
                ...existing,
                unsubscribed: false,
                subscribedAt: BigInt(Date.now()),
            });
        }
        return; // Already subscribed
    }

    ctx.db.newsletterSubscribers.insert({
        id: 0n,
        email,
        subscribedAt: BigInt(Date.now()),
        unsubscribed: false,
    });
});

/**
 * Unsubscribe from the newsletter.
 */
spacetimedb.reducer('unsubscribe_newsletter', {
    email: spacetimedb.type.string(),
}, (ctx, { email }) => {
    const sub = ctx.db.newsletterSubscribers.email.find(email);
    if (!sub) {
        throw new Error('Email not found in newsletter subscribers');
    }

    ctx.db.newsletterSubscribers.id.update({
        ...sub,
        unsubscribed: true,
    });
});

// ─── Domain Blacklist Reducers ──────────────────────────────────────────────

/**
 * Add a domain to the blacklist (admin only in practice).
 */
spacetimedb.reducer('add_blacklisted_domain', {
    domain: spacetimedb.type.string(),
}, (ctx, { domain }) => {
    const existing = ctx.db.blacklistedDomains.domain.find(domain);
    if (existing) return; // Already blacklisted

    ctx.db.blacklistedDomains.insert({
        id: 0n,
        domain: domain.toLowerCase(),
    });
});

/**
 * Seed the blacklisted domains table with common disposable email providers.
 * Should be called once during initial setup.
 */
spacetimedb.reducer('seed_blacklisted_domains', {}, (ctx) => {
    const disposableDomains = [
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
        'anonbox.net',
    ];

    for (const domain of disposableDomains) {
        const existing = ctx.db.blacklistedDomains.domain.find(domain);
        if (!existing) {
            ctx.db.blacklistedDomains.insert({
                id: 0n,
                domain,
            });
        }
    }
});
