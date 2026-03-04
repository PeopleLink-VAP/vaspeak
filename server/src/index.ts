/**
 * SpacetimeDB Module for VASpeak.
 *
 * Tables for auth, membership, and newsletter.
 * Reducers for all auth operations.
 *
 * Uses SpacetimeDB SDK v2.0.2 API.
 * Reducer names are derived from the exported variable names.
 */

import { schema, table, t } from 'spacetimedb/server';

// ─── Schema: All Tables ─────────────────────────────────────────────────────

const spacetimedb = schema({
    users: table(
        { public: true },
        {
            id: t.u64().autoInc().primaryKey(),
            email: t.string().unique(),
            passwordHash: t.string(),
            emailVerified: t.bool().default(false),
            role: t.string().default('user'),
            createdAt: t.u64(),
            updatedAt: t.u64(),
        }
    ),

    emailVerifications: table(
        { public: false },
        {
            id: t.u64().autoInc().primaryKey(),
            userId: t.u64(),
            token: t.string().unique(),
            expiresAt: t.u64(),
        }
    ),

    magicLinks: table(
        { public: false },
        {
            id: t.u64().autoInc().primaryKey(),
            email: t.string(),
            token: t.string().unique(),
            expiresAt: t.u64(),
            used: t.bool().default(false),
        }
    ),

    passwordResets: table(
        { public: false },
        {
            id: t.u64().autoInc().primaryKey(),
            userId: t.u64(),
            token: t.string().unique(),
            expiresAt: t.u64(),
            used: t.bool().default(false),
        }
    ),

    newsletterSubscribers: table(
        { public: false },
        {
            id: t.u64().autoInc().primaryKey(),
            email: t.string().unique(),
            subscribedAt: t.u64(),
            unsubscribed: t.bool().default(false),
        }
    ),

    blacklistedDomains: table(
        { public: true },
        {
            id: t.u64().autoInc().primaryKey(),
            domain: t.string().unique(),
        }
    ),
});

export default spacetimedb;

// ─── Lifecycle ──────────────────────────────────────────────────────────────

export const init = spacetimedb.init(_ctx => { });

// ─── User Registration ──────────────────────────────────────────────────────

export const register_user = spacetimedb.reducer(
    {
        email: t.string(),
        passwordHash: t.string(),
        verificationToken: t.string(),
        tokenExpiresAt: t.u64(),
    },
    (ctx, args) => {
        const now = BigInt(Date.now());

        ctx.db.users.insert({
            id: 0n,
            email: args.email,
            passwordHash: args.passwordHash,
            emailVerified: false,
            role: 'user',
            createdAt: now,
            updatedAt: now,
        });

        const user = ctx.db.users.email.find(args.email);
        if (!user) return;

        ctx.db.emailVerifications.insert({
            id: 0n,
            userId: user.id,
            token: args.verificationToken,
            expiresAt: args.tokenExpiresAt,
        });
    }
);

// ─── Email Verification ─────────────────────────────────────────────────────

export const verify_email = spacetimedb.reducer(
    { token: t.string() },
    (ctx, args) => {
        const verification = ctx.db.emailVerifications.token.find(args.token);
        if (!verification) throw new Error('Invalid verification token');

        const now = BigInt(Date.now());
        if (verification.expiresAt < now) throw new Error('Verification token has expired');

        const user = ctx.db.users.id.find(verification.userId);
        if (!user) throw new Error('User not found');

        ctx.db.users.delete(user);
        ctx.db.users.insert({ ...user, emailVerified: true, updatedAt: now });
        ctx.db.emailVerifications.delete(verification);
    }
);

// ─── Magic Link ─────────────────────────────────────────────────────────────

export const create_magic_link = spacetimedb.reducer(
    { email: t.string(), token: t.string(), expiresAt: t.u64() },
    (ctx, args) => {
        ctx.db.magicLinks.insert({
            id: 0n,
            email: args.email,
            token: args.token,
            expiresAt: args.expiresAt,
            used: false,
        });
    }
);

export const consume_magic_link = spacetimedb.reducer(
    { token: t.string() },
    (ctx, args) => {
        const link = ctx.db.magicLinks.token.find(args.token);
        if (!link) throw new Error('Invalid magic link');

        const now = BigInt(Date.now());
        if (link.expiresAt < now) throw new Error('Magic link has expired');
        if (link.used) throw new Error('Magic link has already been used');

        ctx.db.magicLinks.delete(link);
        ctx.db.magicLinks.insert({ ...link, used: true });

        const user = ctx.db.users.email.find(link.email);
        if (user && !user.emailVerified) {
            ctx.db.users.delete(user);
            ctx.db.users.insert({ ...user, emailVerified: true, updatedAt: now });
        }
    }
);

// ─── Password Reset ─────────────────────────────────────────────────────────

export const request_password_reset = spacetimedb.reducer(
    { userId: t.u64(), token: t.string(), expiresAt: t.u64() },
    (ctx, args) => {
        ctx.db.passwordResets.insert({
            id: 0n,
            userId: args.userId,
            token: args.token,
            expiresAt: args.expiresAt,
            used: false,
        });
    }
);

export const reset_password = spacetimedb.reducer(
    { token: t.string(), newPasswordHash: t.string() },
    (ctx, args) => {
        const reset = ctx.db.passwordResets.token.find(args.token);
        if (!reset) throw new Error('Invalid reset token');

        const now = BigInt(Date.now());
        if (reset.expiresAt < now) throw new Error('Reset token has expired');
        if (reset.used) throw new Error('Reset token has already been used');

        const user = ctx.db.users.id.find(reset.userId);
        if (!user) throw new Error('User not found');

        ctx.db.users.delete(user);
        ctx.db.users.insert({ ...user, passwordHash: args.newPasswordHash, updatedAt: now });

        ctx.db.passwordResets.delete(reset);
        ctx.db.passwordResets.insert({ ...reset, used: true });
    }
);

// ─── Newsletter ─────────────────────────────────────────────────────────────

export const subscribe_newsletter = spacetimedb.reducer(
    { email: t.string() },
    (ctx, args) => {
        const existing = ctx.db.newsletterSubscribers.email.find(args.email);
        if (existing) {
            if (existing.unsubscribed) {
                ctx.db.newsletterSubscribers.delete(existing);
                ctx.db.newsletterSubscribers.insert({
                    ...existing,
                    unsubscribed: false,
                    subscribedAt: BigInt(Date.now()),
                });
            }
            return;
        }
        ctx.db.newsletterSubscribers.insert({
            id: 0n,
            email: args.email,
            subscribedAt: BigInt(Date.now()),
            unsubscribed: false,
        });
    }
);

export const unsubscribe_newsletter = spacetimedb.reducer(
    { email: t.string() },
    (ctx, args) => {
        const subscriber = ctx.db.newsletterSubscribers.email.find(args.email);
        if (!subscriber) throw new Error('Subscriber not found');
        ctx.db.newsletterSubscribers.delete(subscriber);
        ctx.db.newsletterSubscribers.insert({ ...subscriber, unsubscribed: true });
    }
);

// ─── Blacklisted Domains ────────────────────────────────────────────────────

export const add_blacklisted_domain = spacetimedb.reducer(
    { domain: t.string() },
    (ctx, args) => {
        const existing = ctx.db.blacklistedDomains.domain.find(args.domain.toLowerCase());
        if (existing) return;
        ctx.db.blacklistedDomains.insert({ id: 0n, domain: args.domain.toLowerCase() });
    }
);

export const seed_blacklisted_domains = spacetimedb.reducer(ctx => {
    const domains = [
        'tempmail.com', 'throwaway.email', 'mailinator.com', 'guerrillamail.com',
        'yopmail.com', '10minutemail.com', 'trashmail.com', 'sharklasers.com',
        'guerrillamailblock.com', 'grr.la', 'discard.email', 'dispostable.com',
        'mailnesia.com', 'maildrop.cc', 'temp-mail.org', 'fakeinbox.com',
        'burnermail.io', 'tempail.com', 'mohmal.com', 'getnada.com',
    ];
    for (const domain of domains) {
        const existing = ctx.db.blacklistedDomains.domain.find(domain);
        if (!existing) {
            ctx.db.blacklistedDomains.insert({ id: 0n, domain });
        }
    }
});
