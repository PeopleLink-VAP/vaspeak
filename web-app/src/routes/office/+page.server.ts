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
    try {
        const [subscribers, users] = await Promise.all([
            spacetimeQuery<NewsletterSubscriber>(
                'SELECT id, email, subscribed_at, unsubscribed FROM newsletter_subscribers'
            ),
            spacetimeQuery<User>(
                'SELECT id, email, email_verified, role, created_at, updated_at FROM users'
            ),
        ]);

        return {
            subscribers: subscribers
                .map(s => ({
                    ...s,
                    subscribedAt: new Date(Number(s.subscribed_at)).toISOString()
                }))
                .sort((a, b) => b.subscribed_at - a.subscribed_at),
            users: users
                .map(u => ({
                    ...u,
                    createdAt: new Date(Number(u.created_at)).toISOString(),
                    updatedAt: new Date(Number(u.updated_at)).toISOString()
                }))
                .sort((a, b) => b.created_at - a.created_at)
        };
    } catch (error) {
        console.error('[Office] Failed to load data:', error);
        return {
            subscribers: [],
            users: []
        };
    }
};
