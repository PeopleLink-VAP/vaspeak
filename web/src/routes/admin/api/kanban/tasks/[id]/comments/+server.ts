import { json } from '@sveltejs/kit';
import { turso, ensureKanbanSchema } from '$lib/server/turso';
import { nanoid } from 'nanoid';

export async function GET({ params }) {
    await ensureKanbanSchema();
    const result = await turso.execute({
        sql: 'SELECT * FROM kanban_comments WHERE task_id = ? ORDER BY created_at ASC',
        args: [params.id]
    });
    return json(result.rows);
}

export async function POST({ params, request }) {
    await ensureKanbanSchema();
    const body = await request.json();
    const id = nanoid(10);

    await turso.execute({
        sql: 'INSERT INTO kanban_comments (id, task_id, author, body) VALUES (?, ?, ?, ?)',
        args: [id, params.id, body.author ?? 'agent', body.body ?? '']
    });

    return json({ id }, { status: 201 });
}
