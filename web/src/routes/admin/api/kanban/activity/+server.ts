import { json } from '@sveltejs/kit';
import { turso, ensureKanbanSchema } from '$lib/server/turso';

/**
 * GET /admin/api/kanban/activity
 * Returns a merged, chronologically-sorted feed of recent board events:
 *   - Task status changes (from tasks table, using updated_at)
 *   - Comments (from task_comments table)
 * Limited to the most recent 50 events.
 */
export async function GET() {
    await ensureKanbanSchema();

    // Fetch recent tasks (sorted by updated_at) as "status" events
    const tasksResult = await turso.execute(
        `SELECT id, title, status, assignee, updated_at, created_at
         FROM tasks
         ORDER BY updated_at DESC
         LIMIT 30`
    );

    // Fetch recent comments as "comment" events
    const commentsResult = await turso.execute(
        `SELECT c.id, c.task_id, c.author, c.body, c.created_at, t.title as task_title
         FROM task_comments c
         LEFT JOIN tasks t ON t.id = c.task_id
         ORDER BY c.created_at DESC
         LIMIT 30`
    );

    type ActivityItem = {
        id: string;
        type: 'task_update' | 'task_created' | 'comment';
        timestamp: string;
        title: string;
        detail: string;
        actor: string;
        taskId: string;
    };

    const activities: ActivityItem[] = [];

    // Map tasks → activity items
    for (const t of tasksResult.rows) {
        const created = String(t.created_at ?? '');
        const updated = String(t.updated_at ?? '');
        const isNew = created === updated;

        activities.push({
            id: `task-${t.id}`,
            type: isNew ? 'task_created' : 'task_update',
            timestamp: updated,
            title: String(t.title ?? ''),
            detail: String(t.status ?? ''),
            actor: String(t.assignee ?? ''),
            taskId: String(t.id ?? '')
        });
    }

    // Map comments → activity items  
    for (const c of commentsResult.rows) {
        const body = String(c.body ?? '');
        activities.push({
            id: `comment-${c.id}`,
            type: 'comment',
            timestamp: String(c.created_at ?? ''),
            title: String(c.task_title ?? 'Unknown task'),
            detail: body.length > 80 ? body.slice(0, 80) + '…' : body,
            actor: String(c.author ?? ''),
            taskId: String(c.task_id ?? '')
        });
    }

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Return top 50
    return json(activities.slice(0, 50));
}
