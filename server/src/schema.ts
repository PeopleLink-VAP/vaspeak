/**
 * VASpeak SpacetimeDB Module — Schema
 *
 * Defines all tables for auth, membership, newsletter, and domain blacklist.
 * This file exports the `spacetimedb` instance so index.ts can import it
 * and define reducers without circular import issues.
 */

import spacetimedb, { table, index, unique, t } from 'spacetimedb';

// ─── Users ──────────────────────────────────────────────────────────────────

export const User = table(
    {
        name: 'users',
        public: true,
        indexes: [
            { name: 'idx_users_email', algorithm: 'btree', columns: ['email'] },
        ],
    },
    {
        id: t.u64().primaryKey().autoInc(),
        email: t.string().unique(),
        passwordHash: t.string(),
        emailVerified: t.bool(),
        role: t.string(), // "user" | "admin"
        createdAt: t.u64(), // unix ms
        updatedAt: t.u64(), // unix ms
    }
);

// ─── Email Verifications ────────────────────────────────────────────────────

export const EmailVerification = table(
    {
        name: 'email_verifications',
        public: true,
        indexes: [
            { name: 'idx_verify_user', algorithm: 'btree', columns: ['userId'] },
        ],
    },
    {
        id: t.u64().primaryKey().autoInc(),
        userId: t.u64(),
        token: t.string().unique(),
        expiresAt: t.u64(), // unix ms
    }
);

// ─── Magic Links ────────────────────────────────────────────────────────────

export const MagicLink = table(
    {
        name: 'magic_links',
        public: true,
        indexes: [
            { name: 'idx_magic_email', algorithm: 'btree', columns: ['email'] },
        ],
    },
    {
        id: t.u64().primaryKey().autoInc(),
        email: t.string(),
        token: t.string().unique(),
        expiresAt: t.u64(), // unix ms
        used: t.bool(),
    }
);

// ─── Password Resets ────────────────────────────────────────────────────────

export const PasswordReset = table(
    {
        name: 'password_resets',
        public: true,
        indexes: [
            { name: 'idx_reset_user', algorithm: 'btree', columns: ['userId'] },
        ],
    },
    {
        id: t.u64().primaryKey().autoInc(),
        userId: t.u64(),
        token: t.string().unique(),
        expiresAt: t.u64(), // unix ms
        used: t.bool(),
    }
);

// ─── Newsletter Subscribers ────────────────────────────────────────────────

export const NewsletterSubscriber = table(
    {
        name: 'newsletter_subscribers',
        public: true,
        indexes: [
            { name: 'idx_newsletter_email', algorithm: 'btree', columns: ['email'] },
        ],
    },
    {
        id: t.u64().primaryKey().autoInc(),
        email: t.string().unique(),
        subscribedAt: t.u64(), // unix ms
        unsubscribed: t.bool(),
    }
);

// ─── Blacklisted Domains ────────────────────────────────────────────────────

export const BlacklistedDomain = table(
    {
        name: 'blacklisted_domains',
        public: true,
        indexes: [
            { name: 'idx_blacklist_domain', algorithm: 'btree', columns: ['domain'] },
        ],
    },
    {
        id: t.u64().primaryKey().autoInc(),
        domain: t.string().unique(),
    }
);

export default spacetimedb;
