/**
 * init-db.js — VASpeak SQLite migration runner
 * Usage: node scripts/init-db.js
 * Safe to re-run: uses IF NOT EXISTS, won't destroy existing data.
 */

import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = process.env.LIBSQL_DB_URL ?? 'file:../db/local.db';
const db = createClient({ url: dbUrl, authToken: process.env.LIBSQL_AUTH_TOKEN });

const schemaPath = path.resolve(__dirname, '../../schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

async function migrate() {
    console.log(`📦  Target DB: ${dbUrl}`);
    console.log('🔄  Applying schema migrations…');

    // Split on semicolons, filter blanks/comments-only blocks
    const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    let applied = 0;
    for (const stmt of statements) {
        try {
            await db.execute(stmt + ';');
            applied++;
        } catch (err) {
            // Log but don't crash — some statements may be index dupes on re-runs
            console.warn(`  ⚠️  Skipped: ${stmt.slice(0, 60)}… → ${err.message}`);
        }
    }

    console.log(`✅  Done. ${applied} statement(s) applied.`);
}

migrate().catch(err => {
    console.error('❌  Migration failed:', err);
    process.exit(1);
});
