import { createClient } from '@libsql/client';
import { TURSO_DB_URL, TURSO_DB_TOKEN } from '$env/static/private';

export const turso = createClient({
    url: TURSO_DB_URL,
    authToken: TURSO_DB_TOKEN
});

/** Ensure kanban tables exist on the remote Turso DB */
export async function ensureKanbanSchema() {
    await turso.executeMultiple(`
        CREATE TABLE IF NOT EXISTS kanban_tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            expected_outcome TEXT,
            status TEXT NOT NULL DEFAULT 'backlog',
            assignee TEXT,
            workstream TEXT,
            priority TEXT DEFAULT 'medium',
            commit_url TEXT,
            commit_message TEXT,
            work_summary TEXT,
            follow_up_steps TEXT,
            files_changed TEXT,
            lessons_learnt TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS kanban_comments (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
            author TEXT NOT NULL,
            body TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS kanban_attachments (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
            file_name TEXT NOT NULL,
            file_url TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS kanban_focus (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL DEFAULT '',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
}
