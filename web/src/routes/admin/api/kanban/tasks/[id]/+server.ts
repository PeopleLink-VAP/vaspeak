import { json } from '@sveltejs/kit';
import { turso } from '$lib/server/turso';

export async function GET({ params }) {
    const rs = await turso.execute({
        sql: 'SELECT * FROM kanban_tasks WHERE id = ?',
        args: [params.id]
    });
    if (rs.rows.length === 0) return json({ error: 'Task not found' }, { status: 404 });
    return json(rs.rows[0]);
}

export async function PATCH({ params, request }) {
    const body = await request.json();
    const sets: string[] = [];
    const args: (string | null)[] = [];

    const allowedFields = [
        'title', 'description', 'expected_outcome', 'status',
        'assignee', 'workstream', 'priority', 'commit_url',
        'commit_message', 'work_summary', 'follow_up_steps',
        'files_changed', 'lessons_learnt'
    ];

    for (const field of allowedFields) {
        if (field in body) {
            sets.push(`${field} = ?`);
            const val = body[field];
            args.push(typeof val === 'object' ? JSON.stringify(val) : val);
        }
    }

    if (sets.length === 0) {
        return json({ error: 'No fields to update' }, { status: 400 });
    }

    sets.push('updated_at = CURRENT_TIMESTAMP');
    args.push(params.id);

    await turso.execute({
        sql: `UPDATE kanban_tasks SET ${sets.join(', ')} WHERE id = ?`,
        args
    });

    return json({ ok: true });
}

export async function DELETE({ params }) {
    await turso.execute({
        sql: 'DELETE FROM kanban_tasks WHERE id = ?',
        args: [params.id]
    });

    return json({ ok: true });
}
