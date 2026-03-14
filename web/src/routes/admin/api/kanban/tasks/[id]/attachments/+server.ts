import { json } from '@sveltejs/kit';
import { turso, ensureKanbanSchema } from '$lib/server/turso';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';

const UPLOAD_DIR = 'static/uploads/kanban';

export async function POST({ params, request }) {
    await ensureKanbanSchema();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
        return json({ error: 'No file provided' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() ?? 'png';
    const filename = `${params.id}_${nanoid(8)}.${ext}`;
    const uploadPath = join(UPLOAD_DIR, filename);

    await mkdir(UPLOAD_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(uploadPath, buffer);

    // Store attachment reference in a comment
    await turso.execute({
        sql: 'INSERT INTO task_comments (id, task_id, author, body) VALUES (?, ?, ?, ?)',
        args: [
            nanoid(10),
            params.id,
            'attachment',
            `📎 [${file.name}](/uploads/kanban/${filename})`
        ]
    });

    return json({ filename, url: `/uploads/kanban/${filename}` }, { status: 201 });
}
