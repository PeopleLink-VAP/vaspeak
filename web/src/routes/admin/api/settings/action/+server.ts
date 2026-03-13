import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { exec } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';

const execAsync = promisify(exec);
const DB_PATH = resolve('../db/local.db');

// POST /admin/api/settings/backup — streams the SQLite file as a download
export async function POST({ request }) {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const action = body.action as string;

    if (action === 'backup') {
        try {
            // Run VACUUM INTO a temp snapshot
            const snapshotPath = `/tmp/vaspeak-backup-${Date.now()}.db`;
            await db.execute(`VACUUM INTO '${snapshotPath}'`);

            const { readFileSync } = await import('fs');
            const file = readFileSync(snapshotPath);

            return new Response(file, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': `attachment; filename="vaspeak-${new Date().toISOString().slice(0, 10)}.db"`,
                    'Content-Length': String(file.length)
                }
            });
        } catch (err) {
            return json({ error: String(err) }, { status: 500 });
        }
    }

    if (action === 'git_pull') {
        try {
            const { stdout, stderr } = await execAsync('git pull --ff-only', {
                cwd: '/media/dev/PROJECTS/LAB/vaspeak',
                timeout: 30_000
            });
            return json({ ok: true, output: stdout || stderr });
        } catch (err: unknown) {
            return json({ error: String(err) }, { status: 500 });
        }
    }

    return json({ error: 'Unknown action' }, { status: 400 });
}
