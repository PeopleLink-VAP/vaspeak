/**
 * Server-side SpacetimeDB connection helper.
 *
 * Provides a thin HTTP-based interface to SpacetimeDB for use in
 * SvelteKit API routes (which run as serverless functions on Netlify).
 *
 * Since serverless functions are short-lived, we use the SpacetimeDB
 * HTTP SQL endpoint instead of persistent WebSocket connections.
 * For reducer calls, we use the HTTP call endpoint.
 */

import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

function getBaseUrl(): string {
    // HTTP endpoint uses https:// instead of wss://
    const wsUri = publicEnv.PUBLIC_SPACETIMEDB_URI || 'wss://spacetimedb.com';
    return wsUri.replace('wss://', 'https://').replace('ws://', 'http://');
}

function getModuleName(): string {
    return publicEnv.PUBLIC_SPACETIMEDB_MODULE || 'vaspeak-dev';
}

function getAuthToken(): string | undefined {
    return env.SPACETIMEDB_TOKEN;
}

/**
 * Execute a SQL query against the SpacetimeDB module.
 * Used for reading data from tables.
 */
export async function spacetimeQuery<T = Record<string, unknown>>(
    sql: string
): Promise<T[]> {
    const baseUrl = getBaseUrl();
    const moduleName = getModuleName();

    const response = await fetch(
        `${baseUrl}/database/sql/${moduleName}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
                ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
            },
            body: sql,
        }
    );

    if (!response.ok) {
        const error = await response.text();
        console.error(`[SpacetimeDB] SQL query failed:`, error);
        throw new Error(`SpacetimeDB query failed: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // SpacetimeDB SQL returns rows as arrays within the response
    // The structure may vary — adapt based on actual response format
    if (Array.isArray(data)) {
        return data as T[];
    }

    // Handle the common response format: { rows: [...] }
    if (data.rows) {
        return data.rows as T[];
    }

    return [];
}

/**
 * Call a SpacetimeDB reducer via HTTP.
 * Used when we can't use persistent WebSocket connections (serverless).
 */
export async function spacetimeCallReducer(
    reducerName: string,
    args: Record<string, unknown>
): Promise<void> {
    const baseUrl = getBaseUrl();
    const moduleName = getModuleName();

    const response = await fetch(
        `${baseUrl}/database/call/${moduleName}/${reducerName}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
            },
            body: JSON.stringify(args),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        console.error(`[SpacetimeDB] Reducer call failed:`, reducerName, error);
        throw new Error(`SpacetimeDB reducer '${reducerName}' failed: ${response.status} - ${error}`);
    }
}

/**
 * Convenience: query a user by email.
 */
export async function findUserByEmail(email: string) {
    const rows = await spacetimeQuery<{
        id: number;
        email: string;
        password_hash: string;
        email_verified: boolean;
        role: string;
        created_at: number;
        updated_at: number;
    }>(`SELECT * FROM users WHERE email = '${email.replace(/'/g, "''")}'`);

    return rows[0] ?? null;
}

/**
 * Convenience: query a user by ID.
 */
export async function findUserById(userId: number) {
    const rows = await spacetimeQuery<{
        id: number;
        email: string;
        password_hash: string;
        email_verified: boolean;
        role: string;
        created_at: number;
        updated_at: number;
    }>(`SELECT * FROM users WHERE id = ${userId}`);

    return rows[0] ?? null;
}

/**
 * Check if a domain is blacklisted in SpacetimeDB.
 */
export async function isBlacklistedDomainInDb(domain: string): Promise<boolean> {
    const rows = await spacetimeQuery(
        `SELECT * FROM blacklisted_domains WHERE domain = '${domain.replace(/'/g, "''").toLowerCase()}'`
    );
    return rows.length > 0;
}
