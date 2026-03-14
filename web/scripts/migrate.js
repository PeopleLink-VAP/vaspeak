import { createClient } from '@libsql/client';

const db = createClient({ url: 'file:../db/local.db' });

async function run() {
    try {
        await db.execute("ALTER TABLE profiles ADD COLUMN avatar_url TEXT;");
        console.log("Added avatar_url to profiles");
    } catch(e) { 
        console.log("Column avatar_url may already exist:", e.message); 
    }
    
    try {
        await db.execute(`CREATE TABLE IF NOT EXISTS user_feedback (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
            user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            topic TEXT NOT NULL,
            message TEXT NOT NULL,
            attachment_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`);
        console.log("Created user_feedback table");
    } catch(e) { 
        console.log("Error creating table:", e.message); 
    }
}
run();
