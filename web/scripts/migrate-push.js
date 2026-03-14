import { createClient } from '@libsql/client';

const db = createClient({ url: 'file:../db/local.db' });

async function run() {
    try {
        await db.execute(`CREATE TABLE IF NOT EXISTS push_subscriptions (
            user_id       TEXT NOT NULL,
            endpoint      TEXT NOT NULL,
            p256dh        TEXT NOT NULL,
            auth          TEXT NOT NULL,
            reminder_hour INTEGER NOT NULL DEFAULT 8,
            timezone      TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
            active        INTEGER NOT NULL DEFAULT 1,
            created_at    TEXT NOT NULL DEFAULT (datetime('now')),
            PRIMARY KEY (user_id, endpoint)
        );`);
        console.log("✅ Created push_subscriptions table");
    } catch(e) {
        console.log("Error creating push_subscriptions:", e.message);
    }
}
run();
