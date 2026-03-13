import { createClient } from '@libsql/client';
import { env } from '$env/dynamic/private';

// Local SQLite for app data. Falls back to a local file if LIBSQL_DB_URL is unset.
// Using $env/dynamic/private so this works at both build-time and runtime (adapter-node).
const dbUrl = env.LIBSQL_DB_URL || 'file:../db/local.db';

export const db = createClient({
    url: dbUrl,
    authToken: env.LIBSQL_AUTH_TOKEN
});
