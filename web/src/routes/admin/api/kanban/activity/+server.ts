import { json } from '@sveltejs/kit';
import { turso, ensureKanbanSchema } from '$lib/server/turso';
import { utc } from '$lib/utils';

export async function GET() {
    await ensureKanbanSchema();

    const tasksResult = await turso.execute(
        `SELECT id, title, status, assignee, updated_at, created_at
         FROM kanban_tasks ORDER BY updated_at DESC LIMIT 30`
    );

    const commentsResult = await turso.execute(
        `SELECT c.id, c.task_id, c.author, c.body, c.created_at, t.title as task_title
         FROM kanban_comments c
         LEFT JOIN kanban_tasks t ON t.id = c.task_id
         ORDER BY c.created_at DESC LIMIT 30`
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

    for (const t of tasksResult.rows) {
        const created = String(t.created_at ?? '');
        const updated = String(t.updated_at ?? '');
        const isNew = created === updated;

        activities.push({
            id: `task-${t.id}`,
            type: isNew ? 'task_created' : 'task_update',
            timestamp: utc(updated),
            title: String(t.title ?? ''),
            detail: String(t.status ?? ''),
            actor: String(t.assignee ?? ''),
            taskId: String(t.id ?? '')
        });
    }

    for (const c of commentsResult.rows) {
        const body = String(c.body ?? '');
        activities.push({
            id: `comment-${c.id}`,
            type: 'comment',
            timestamp: utc(c.created_at),
            title: String(c.task_title ?? 'Unknown task'),
            detail: body.length > 80 ? body.slice(0, 80) + '…' : body,
            actor: String(c.author ?? ''),
            taskId: String(c.task_id ?? '')
        });
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return json(activities.slice(0, 50));
}
