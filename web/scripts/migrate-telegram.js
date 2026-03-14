/**
 * Migration: Create telegram_links table
 * Run: node scripts/migrate-telegram.js
 */
import { createClient } from '@libsql/client';
import 'dotenv/config';

const db = createClient({
  url: process.env.LIBSQL_DB_URL || 'file:../db/local.db',
  authToken: process.env.LIBSQL_AUTH_TOKEN
});

async function migrate() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS telegram_links (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL UNIQUE REFERENCES profiles(id),
      link_token TEXT UNIQUE,
      telegram_chat_id TEXT,
      telegram_username TEXT,
      linked_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✅ telegram_links table created');
}

migrate().catch(console.error);
