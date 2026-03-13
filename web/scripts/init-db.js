import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = 'file:../db/local.db';
const db = createClient({ url });

const schemaPath = path.resolve(__dirname, '../../schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

async function main() {
  try {
    await db.executeMultiple(schema);
    console.log('Schema applied successfully.');
  } catch (e) {
    console.error('Failed to apply schema:', e);
    process.exit(1);
  }
}

main();
