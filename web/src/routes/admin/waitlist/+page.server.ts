import { db } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
    const limit = 50;
    const offset = (page - 1) * limit;

    try {
        const [subsResult, countResult, statsResult] = await Promise.all([
            db.execute({
                sql: `SELECT id, email, source, subscribed_at
                      FROM newsletter_subscribers
                      ORDER BY subscribed_at DESC
                      LIMIT ? OFFSET ?`,
                args: [limit, offset]
            }),
            db.execute({ sql: `SELECT COUNT(*) as total FROM newsletter_subscribers`, args: [] }),
            db.execute({
                sql: `SELECT source, COUNT(*) as count
                      FROM newsletter_subscribers
                      GROUP BY source`,
                args: []
            })
        ]);

        const total = Number(countResult.rows[0]?.total ?? 0);
        const bySource: Record<string, number> = {};
        for (const row of statsResult.rows) {
            bySource[String(row.source)] = Number(row.count);
        }

        return {
            subscribers: subsResult.rows,
            total,
            page,
            pages: Math.ceil(total / limit),
            bySource
        };
    } catch (err) {
        console.error('[admin/waitlist] load error:', err);
        return { subscribers: [], total: 0, page: 1, pages: 1, bySource: {} };
    }
};

export const actions: Actions = {
    // Delete a single subscriber
    delete: async ({ request }) => {
        const data = await request.formData();
        const id = String(data.get('id') ?? '');
        try {
            await db.execute({ sql: `DELETE FROM newsletter_subscribers WHERE id = ?`, args: [id] });
        } catch (err) {
            console.error('[admin/waitlist] delete error:', err);
            return fail(500, { error: 'Failed to delete subscriber' });
        }
        return { success: true };
    }
};
