import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

/**
 * GET /admin/api/activity
 * Returns a merged feed of recent user-facing activity:
 *   - User signups (profiles.created_at)
 *   - Waitlist entries (newsletter_subscribers.subscribed_at)
 *   - Lesson completions (user_progress.completed_at)
 * Limited to the most recent 50 events, sorted newest first.
 */
export async function GET() {
    type ActivityItem = {
        id: string;
        type: 'signup' | 'waitlist' | 'progress';
        timestamp: string;
        title: string;
        detail: string;
    };

    const activities: ActivityItem[] = [];

    try {
        // Recent signups
        const signups = await db.execute(
            `SELECT id, display_name, email, created_at FROM profiles ORDER BY created_at DESC LIMIT 20`
        );
        for (const r of signups.rows) {
            activities.push({
                id: `signup-${r.id}`,
                type: 'signup',
                timestamp: String(r.created_at ?? ''),
                title: String(r.display_name || r.email || 'New user'),
                detail: String(r.email ?? '')
            });
        }
    } catch { /* table may not exist */ }

    try {
        // Recent waitlist entries
        const waitlist = await db.execute(
            `SELECT id, email, source, subscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC LIMIT 20`
        );
        for (const r of waitlist.rows) {
            activities.push({
                id: `waitlist-${r.id}`,
                type: 'waitlist',
                timestamp: String(r.subscribed_at ?? ''),
                title: String(r.email ?? ''),
                detail: String(r.source ?? 'landing')
            });
        }
    } catch { /* table may not exist */ }

    try {
        // Recent lesson completions
        const progress = await db.execute(
            `SELECT up.id, up.user_id, up.lesson_id, up.completed_at,
                    p.display_name, p.email,
                    l.title as lesson_title, l.day_number
             FROM user_progress up
             LEFT JOIN profiles p ON p.id = up.user_id
             LEFT JOIN lessons l ON l.id = up.lesson_id
             WHERE up.completed_at IS NOT NULL
             ORDER BY up.completed_at DESC LIMIT 20`
        );
        for (const r of progress.rows) {
            const userName = String(r.display_name || r.email || 'User');
            const lessonTitle = r.lesson_title ? String(r.lesson_title) : `Day ${r.day_number}`;
            activities.push({
                id: `progress-${r.id}`,
                type: 'progress',
                timestamp: String(r.completed_at ?? ''),
                title: userName,
                detail: `Completed: ${lessonTitle}`
            });
        }
    } catch { /* table may not exist */ }

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return json(activities.slice(0, 50));
}
