import { json } from '@sveltejs/kit';
import { turso, ensureKanbanSchema } from '$lib/server/turso';
import { nanoid } from 'nanoid';

export async function GET() {
    await ensureKanbanSchema();
    const result = await turso.execute('SELECT * FROM kanban_tasks ORDER BY updated_at DESC');
    return json(result.rows);
}

export async function POST({ request }) {
    await ensureKanbanSchema();
    const body = await request.json();
    const id = nanoid(10);

    await turso.execute({
        sql: `INSERT INTO kanban_tasks (id, title, description, expected_outcome, status, assignee, workstream)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
            id,
            body.title ?? '',
            body.description ?? '',
            body.expected_outcome ?? '',
            body.status ?? 'todo',
            body.assignee ?? '',
            body.workstream ?? ''
        ]
    });

    return json({ id }, { status: 201 });
}
