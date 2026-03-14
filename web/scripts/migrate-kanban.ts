import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const turso = createClient({
    url: process.env.TURSO_DB_URL!,
    authToken: process.env.TURSO_DB_TOKEN!
});

async function main() {
    console.log("Renaming tasks table...");
    try {
        await turso.execute('ALTER TABLE tasks RENAME TO kanban_tasks;');
        console.log("tasks -> kanban_tasks DONE");
    } catch(e: any) { console.log(e.message); }

    console.log("Renaming task_comments table...");
    try {
        await turso.execute('ALTER TABLE task_comments RENAME TO kanban_comments;');
        console.log("task_comments -> kanban_comments DONE");
    } catch(e: any) { console.log(e.message); }

    console.log("Creating kanban_attachments table...");
    await turso.execute(`
        CREATE TABLE IF NOT EXISTS kanban_attachments (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
            file_name TEXT NOT NULL,
            file_url TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log("kanban_attachments created.");

    console.log("Done!");
}
main().catch(console.error);
