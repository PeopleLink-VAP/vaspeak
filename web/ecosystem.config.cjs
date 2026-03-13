/**
 * PM2 ecosystem config — VASpeak
 * Production: runs the SvelteKit Node adapter build (node build/index.js).
 * Dev: runs vite dev server.
 *
 * Secrets are loaded from .env via dotenv so they persist across reboots.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

module.exports = {
  apps: [
    {
      name: 'vaspeak-prod',
      // Run the compiled SvelteKit Node adapter output
      script: '/media/dev/PROJECTS/LAB/vaspeak/web/build/index.js',
      cwd: '/media/dev/PROJECTS/LAB/vaspeak/web',
      watch: false,
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
        PORT: '19300',
        HOST: '0.0.0.0',
        // ORIGIN is required by SvelteKit for CSRF checking behind a reverse proxy
        ORIGIN: 'https://vaspeak.alphabits.team',
        PUBLIC_BASE_URL: 'https://vaspeak.alphabits.team',
        // All secrets pulled from server environment — run:
        //   pm2 reload ecosystem.config.cjs --update-env
        // after setting env vars on the host.
        RESEND_API_KEY:       process.env.RESEND_API_KEY       || '',
        GROQ_API_KEY:         process.env.GROQ_API_KEY         || '',
        ADMIN_AUTH_USER:      process.env.ADMIN_AUTH_USER      || 'admin',
        ADMIN_AUTH_PASSWORD:  process.env.ADMIN_AUTH_PASSWORD  || '',
        TURSO_DB_URL:         process.env.TURSO_DB_URL         || '',
        TURSO_DB_TOKEN:       process.env.TURSO_DB_TOKEN       || '',
        JWT_SECRET:           process.env.JWT_SECRET           || '',
        LIBSQL_DB_URL:        process.env.LIBSQL_DB_URL        || 'file:../db/local.db',
      }
    },
    {
      name: 'vaspeak-dev',
      script: 'npm',
      args: 'run dev -- --port 19301 --host',
      cwd: '/media/dev/PROJECTS/LAB/vaspeak/web',
      watch: false,
      env: {
        NODE_ENV: 'development',
        ORIGIN: 'https://vaspeak-beta.alphabits.team',
      }
    }
  ]
};
