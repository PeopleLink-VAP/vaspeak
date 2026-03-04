/**
 * SpacetimeDB connection configuration.
 *
 * Reads from public env vars so it works both client-side and server-side.
 * The module name determines which database (dev vs prod) we connect to.
 *
 * Both databases are REMOTE on SpacetimeDB maincloud:
 *   - vaspeak-dev  → local development
 *   - vaspeak-prod → Netlify production
 */

import { env } from '$env/dynamic/public';

export const spacetimeConfig = {
    /** WebSocket URI for SpacetimeDB (wss://spacetimedb.com for maincloud) */
    uri: env.PUBLIC_SPACETIMEDB_URI || 'wss://spacetimedb.com',

    /** Module name: 'vaspeak-dev' or 'vaspeak-prod' */
    module: env.PUBLIC_SPACETIMEDB_MODULE || 'vaspeak-dev',
} as const;
