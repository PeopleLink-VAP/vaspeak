/**
 * Admin office users page - load users.
 */

import type { PageServerLoad } from './$types';
import { spacetimeQuery } from '$lib/server/spacetimedb';

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
        const users = await spacetimeQuery<User>(
            'SELECT id, email, email_verified, role, created_at, updated_at FROM users'
        );

        return {
            users: users
                .map(u => ({
                    ...u,
                    createdAt: new Date(Number(u.created_at)).toISOString(),
                    updatedAt: new Date(Number(u.updated_at)).toISOString()
                }))
                .sort((a, b) => b.created_at - a.created_at)
        };
    } catch (error) {
        console.error('[Office Users] Failed to load data:', error);
        return {
            users: []
        };
    }
};
