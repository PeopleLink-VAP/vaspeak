/**
 * PM2 ecosystem config — VASpeak
 * Secrets are loaded from the system environment (set via .env or server config).
 * DO NOT commit real secrets here — use `pm2 start ecosystem.config.cjs --env production`
 * after exporting the required env vars.
 */
module.exports = {
  apps: [
    {
      name: 'vaspeak-prod',
      script: 'npm',
      args: 'run preview -- --port 19300 --host',
      cwd: './web',
      watch: false,
      env: {
        NODE_ENV: 'production',
        // ORIGIN tells SvelteKit what the real public URL is (needed behind Cloudflare tunnel)
        ORIGIN: 'https://vaspeak.alphabits.team',
        PUBLIC_BASE_URL: 'https://vaspeak.alphabits.team',
        // Secrets — loaded from process environment, set these on the server:
        // RESEND_API_KEY, GROQ_API_KEY, ADMIN_AUTH_USER, ADMIN_AUTH_PASSWORD,
        // TURSO_DB_URL, TURSO_DB_TOKEN, JWT_SECRET, LIBSQL_DB_URL
        RESEND_API_KEY: process.env.RESEND_API_KEY || '',
        GROQ_API_KEY: process.env.GROQ_API_KEY || '',
        ADMIN_AUTH_USER: process.env.ADMIN_AUTH_USER || 'admin',
        ADMIN_AUTH_PASSWORD: process.env.ADMIN_AUTH_PASSWORD || '',
        TURSO_DB_URL: process.env.TURSO_DB_URL || '',
        TURSO_DB_TOKEN: process.env.TURSO_DB_TOKEN || '',
        JWT_SECRET: process.env.JWT_SECRET || '',
      }
    },
    {
      name: 'vaspeak-dev',
      script: 'npm',
      args: 'run dev -- --port 19301 --host',
      cwd: './web',
      watch: false,
      env: {
        NODE_ENV: 'development',
        ORIGIN: 'https://vaspeak-beta.alphabits.team',
      }
    }
  ]
};
