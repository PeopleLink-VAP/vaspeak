import { turso, ensureKanbanSchema } from '$lib/server/turso';

export async function load() {
    await ensureKanbanSchema();

    const result = await turso.execute(
        'SELECT * FROM tasks ORDER BY updated_at DESC'
    );

    const tasks = result.rows.map((row) => ({
        id: row.id as string,
        title: row.title as string,
        description: (row.description ?? '') as string,
        expected_outcome: (row.expected_outcome ?? '') as string,
        status: row.status as string,
        assignee: (row.assignee ?? '') as string,
        workstream: (row.workstream ?? '') as string,
        priority: (row.priority ?? 'medium') as string,
        work_summary: (row.work_summary ?? '') as string,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string
    }));

    const columns = ['backlog', 'todo', 'in_progress', 'review_blocked', 'done'];
    const grouped: Record<string, typeof tasks> = {};
    for (const col of columns) {
        grouped[col] = tasks.filter((t) => t.status === col);
    }

    return { columns, grouped, allTasks: tasks };
}
