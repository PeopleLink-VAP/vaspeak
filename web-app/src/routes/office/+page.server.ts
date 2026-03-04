/**
 * Admin office page - load newsletter subscribers and users.
 */

import type { PageServerLoad } from './$types';
import { spacetimeQuery } from '$lib/server/spacetimedb';

interface NewsletterSubscriber {
    id: number;
    email: string;
    subscribed_at: number;
    unsubscribed: boolean;
}

interface User {
    id: number;
    email: string;
    email_verified: boolean;
    role: string;
    created_at: number;
    updated_at: number;
}

export const load: PageServerLoad = async () => {
    const [subscribers, users] = await Promise.all([
        spacetimeQuery<NewsletterSubscriber>(
            'SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC'
        ),
        spacetimeQuery<User>(
            'SELECT id, email, email_verified, role, created_at, updated_at FROM users ORDER BY created_at DESC'
        ),
    ]);

    return {
        subscribers: subscribers.map(s => ({
            ...s,
            subscribedAt: new Date(Number(s.subscribed_at)).toISOString()
        })),
        users: users.map(u => ({
            ...u,
            createdAt: new Date(Number(u.created_at)).toISOString(),
            updatedAt: new Date(Number(u.updated_at)).toISOString()
        }))
    };
};
