import { createClient } from '@libsql/client';

const dbUrl = process.env.LIBSQL_DB_URL || 'file:../db/local.db';

export const db = createClient({
    url: dbUrl,
    authToken: process.env.LIBSQL_AUTH_TOKEN
});
