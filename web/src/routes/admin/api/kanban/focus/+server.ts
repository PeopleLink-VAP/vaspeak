import { json } from '@sveltejs/kit';
import { turso, ensureKanbanSchema } from '$lib/server/turso';

export async function GET() {
    await ensureKanbanSchema();
    const result = await turso.execute(
        "SELECT value FROM kanban_focus WHERE key = 'weekly_focus' LIMIT 1"
    );
    const focus = (result.rows[0]?.value as string) ?? '';
    return json({ focus });
}

export async function PUT({ request }) {
    await ensureKanbanSchema();
    const { focus } = await request.json();

    await turso.execute({
        sql: `INSERT INTO kanban_focus (key, value) VALUES ('weekly_focus', ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        args: [focus ?? '']
    });

    return json({ ok: true });
}
