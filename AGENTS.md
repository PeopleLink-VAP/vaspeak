# Development Guidelines

This document serves as the guide for humans and AI agents extending or maintaining **VASpeak**.

## Context & Key Architecture Decisions

- **Auth**: Email/password + magic links, handled by SvelteKit API routes. SpacetimeDB stores user data; SvelteKit handles bcrypt, JWT sessions (7-day httpOnly cookies), and email sending via Resend.
- **No OIDC**: We do NOT use SpacetimeDB's OIDC identity system — all auth is managed server-side.
- **Dual SpacetimeDB environments**: `vaspeak-dev` (local dev) and `vaspeak-prod` (Netlify). Selected by `PUBLIC_SPACETIMEDB_MODULE` env var.
- **Serverless-safe DB client**: `src/lib/server/spacetimedb.ts` uses SpacetimeDB's HTTP SQL/reducer endpoints (not WebSocket), safe for Netlify Functions.
- **SpacetimeDB SDK v2.0.2**: Single-file module (`server/src/index.ts`) using `schema({key: table(opts, cols)})` + `spacetimedb.reducer(name, params, fn)` pattern.
- **SpacetimeDB Tables**: `users`, `emailVerifications`, `magicLinks`, `passwordResets`, `newsletterSubscribers`, `blacklistedDomains`.
- **Disposable email checking**: Uses `disposable-email-domains` npm package (121K+ domains), not a custom list.
- **4 User Levels**: Survival Speaker → Working VA → Client Manager → Strategic Partner
- **Weekly Themes**: Lessons group into weekly themes, 5 daily lessons each.
- **Simulation Difficulties**: Practice, Real, Stress.

## Tech & Framework Guidelines

1. **SvelteKit 5**:
   - Utilize Svelte 5 Runes for reactivity (`$state`, `$derived`, `$props`).
   - Follow standard `+page.svelte`, `+layout.svelte`, `+server.ts` conventions.
   - Use `event.locals.user` (set by `hooks.server.ts`) to check auth in load functions.

2. **Database (SpacetimeDB)**:
   - Server module lives in `server/src/` (TypeScript).
   - After schema changes: rebuild module → republish → regenerate bindings.
   - Client bindings live in `web-app/src/lib/module_bindings/` (generated, do not edit).
   - Use `$lib/server/spacetimedb.ts` helpers in API routes for DB reads/writes.
   - Real-time subscriptions (when needed): use the `spacetimedb/svelte` SDK in Svelte components.

3. **Auth patterns**:
   - Check `event.locals.user` in `+page.server.ts` load functions for protected pages.
   - Use `redirect(303, '/login')` for unauthenticated access.
   - Never expose `password_hash` to the client.
   - Anti-enumeration: forgot-password and magic-link endpoints always return success.

4. **Styling**:
   - Tailwind CSS 4 with custom theme tokens in `src/app.css`.
   - Primary color: `#196376`. Use `btn-primary`, `card` component classes.
   - Keep animations smooth and purposeful (no gratuitous motion).

5. **Environment Variables**:
   - Private (server-only): `JWT_SECRET`, `RESEND_API_KEY`, `GROQ_API_KEY`, `SPACETIMEDB_TOKEN`, `SITE_URL`
   - Public (client + server): `PUBLIC_SPACETIMEDB_URI`, `PUBLIC_SPACETIMEDB_MODULE`
   - Access via `$env/static/private`, `$env/dynamic/private`, or `$env/dynamic/public`.

## Key Commands

```bash
# Dev
cd web-app && npm run dev

# Tests
npm run test:unit        # vitest unit tests (32 tests)
npx playwright test      # E2E API tests (27 tests)

# Build
npm run build

# SpacetimeDB (from project root, add CLI to PATH first)
spacetime build -p ./server
spacetime publish vaspeak-dev -p ./server --yes
spacetime publish vaspeak-prod -p ./server --yes
spacetime generate --lang typescript --out-dir ./web-app/src/lib/module_bindings -p ./server
spacetime logs vaspeak-dev -f
spacetime call vaspeak-dev seed_blacklisted_domains '{}'
```

## Build & Deploy Cycle

- Netlify auto-deploys from GitHub on push to `main`.
- Live at: [vaspeak.netlify.app](https://vaspeak.netlify.app)
- Verified builds: `npm run build` in `web-app/` before deploying.
- Netlify env vars needed: all `.env.example` vars, with `PUBLIC_SPACETIMEDB_MODULE=vaspeak-prod` and `PUBLIC_SPACETIMEDB_URI=wss://maincloud.spacetimedb.com`.

## Version Control

- **Always commit once a change is done and approved.** Do not leave uncommitted work.
- Use **comprehensive, detailed commit messages** explaining what changed and why.
- Follow conventional commit format: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- Include a summary line and a detailed body listing all notable changes.
- Push to the remote after committing so Netlify auto-deploys.
