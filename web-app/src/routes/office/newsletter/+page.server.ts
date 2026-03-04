/**
 * Admin office newsletter page - load newsletter subscribers.
 */

import type { PageServerLoad } from './$types';
import { spacetimeQuery } from '$lib/server/spacetimedb';

interface NewsletterSubscriber {
    id: number;
    email: string;
    subscribed_at: number;
    unsubscribed: boolean;
}

export const load: PageServerLoad = async () => {
    try {
        const subscribers = await spacetimeQuery<NewsletterSubscriber>(
            'SELECT id, email, subscribed_at, unsubscribed FROM newsletter_subscribers'
        );

        return {
            subscribers: subscribers
                .map(s => ({
                    ...s,
                    subscribedAt: new Date(Number(s.subscribed_at)).toISOString()
                }))
                .sort((a, b) => b.subscribed_at - a.subscribed_at)
        };
    } catch (error) {
        console.error('[Office Newsletter] Failed to load data:', error);
        return {
            subscribers: []
        };
    }
};
