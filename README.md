# VASpeak

## Overview

**VASpeak** is a gamified, mobile-first, "Duolingo-like" English speaking confidence trainer for Vietnamese Virtual Assistants (VAs). It offers daily 4-block lessons structured around real-world communication confidence, with AI-powered roleplay and a full gamification system.

### Lesson Flow

Each day completes a guided 4-block structure:

1. **Listening Decoding** — Audio comprehension with fill-in-the-blank
2. **Pattern Drilling** — Repeat-after-me speaking practice
3. **Guided Simulation** — AI roleplay chat (Groq-powered, credit-gated)
4. **Emotional Reflection** — Emoji + text self-assessment

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | SvelteKit 5, TypeScript, Tailwind CSS 4 |
| Database | **SQLite** (`@libsql/client`) for app data; **Turso** for admin Kanban |
| Auth | Custom server-side — bcrypt + JWT httpOnly cookies + magic links |
| Email | Resend API (email verification, magic links, password reset) |
| AI | Groq API — Llama models (Block 3 roleplay, credit-gated) |
| PWA | `manifest.webmanifest` + `service-worker.ts` + install prompt |
| Hosting | Self-hosted, Node adapter, PM2 process manager |
| Reverse Proxy | Cloudflare Tunnel → `vaspeak.alphabits.team` |

---

## Getting Started

### Prerequisites

- Node.js v20+
- A running SQLite database (auto-created on first run)

### Setup

```bash
# 1. Install dependencies
cd web && npm install

# 2. Copy and fill env file
cp .env.example .env  # see Environment Variables below

# 3. Start dev server (port 19301)
npm run dev
```

### Environment Variables (`.env`)

```bash
RESEND_API_KEY=""                  # Resend API key for transactional email
GROQ_API_KEY=""                    # Groq API key for AI roleplay
ADMIN_AUTH_USER="admin"            # Admin dashboard username
ADMIN_AUTH_PASSWORD=""             # Admin dashboard password
TURSO_DB_URL=""                    # Turso remote DB URL (admin Kanban)
TURSO_DB_TOKEN=""                  # Turso auth token
JWT_SECRET=""                      # min 32 chars, random string
PUBLIC_BASE_URL="http://localhost:5173"
```

---

## Project Structure

```
vaspeak/
├── AGENTS.md                  # AI agent master context (always read first)
├── SITE.md                    # Sitemap, routes, deployment overview
├── schema.sql                 # SQLite schema (reference)
├── web/                       # SvelteKit 5 application
│   ├── ecosystem.config.cjs   # PM2 process config (prod + dev)
│   ├── src/
│   │   ├── hooks.server.ts    # Auth middleware (JWT session guard)
│   │   ├── service-worker.ts  # PWA offline caching
│   │   ├── lib/
│   │   │   ├── pwa.ts         # PWA install prompt (SSR-safe)
│   │   │   ├── utils.ts       # Shared utilities
│   │   │   └── server/
│   │   │       ├── auth.ts        # JWT + bcrypt helpers
│   │   │       ├── db.ts          # SQLite (libsql) client
│   │   │       ├── turso.ts       # Turso remote client (admin)
│   │   │       ├── email.ts       # Resend email integration
│   │   │       ├── magic-link.ts  # Magic link token gen/verify
│   │   │       ├── credits.ts     # Credit balance helpers
│   │   │       └── groq.ts        # Groq API wrapper
│   │   └── routes/
│   │       ├── +page.svelte          # Landing page + waitlist
│   │       ├── login/                # Auth portal (login/register/magic)
│   │       ├── auth/magic/           # Magic link verification
│   │       ├── dashboard/            # User dashboard
│   │       ├── lesson/[day]/         # 4-block lesson page
│   │       ├── credits/              # Credits ledger UI
│   │       ├── admin/                # Admin section (password-protected)
│   │       │   ├── kanban/           # Turso Kanban board
│   │       │   ├── settings/         # System health & DB info
│   │       │   └── e2e-testing/      # Playwright recording viewer
│   │       └── api/
│   │           ├── roleplay/         # Groq AI roleplay (credit-gated)
│   │           ├── progress/         # User block completion writes
│   │           ├── credits/          # Credits ledger reads/writes
│   │           └── waitlist/         # Waitlist signup
│   └── static/
│       ├── manifest.webmanifest
│       ├── icon-192.png
│       ├── icon-512.png
│       └── icon-maskable.png
└── .agents/skills/            # AI agent skills library
```

---

## Auth Features

- ✅ Email + password registration (with strength validation)
- ✅ Email verification enforced on password login
- ✅ Login with JWT session cookie (httpOnly, 7-day)
- ✅ Magic link login (15-minute token, passwordless) — auto-verifies email on use
- ✅ Forgot password / password reset (1-hour token)
- ✅ Blacklisted domain DB table (admin-managed, not yet enforced on registration)
- ✅ Anti-enumeration (forgot-password/magic-link always return success)
- ✅ Route guards via `hooks.server.ts`
- ✅ Rate limiting — auth (10/min), magic link (5/10min), waitlist (3/min), roleplay (30/min)

---

## Testing

```bash
# Unit tests (validation + auth utilities)
npm run test:unit

# E2E API tests (Playwright — requires dev server)
npx playwright test

# View E2E recordings
# Open /admin/e2e-testing in browser
```

---

## Deployment

```bash
# Build production bundle
npm run build

# Start via PM2 (reads ecosystem.config.cjs)
pm2 start ecosystem.config.cjs

# Reload prod with updated env vars
pm2 reload ecosystem.config.cjs --only vaspeak-prod --update-env
```

- **Production**: `vaspeak.alphabits.team` (port 19300, Cloudflare tunnel)
- **Dev/Beta**: `vaspeak-beta.alphabits.team` (port 19301, Cloudflare tunnel)

---

## Roadmap

1. ✅ **Authentication** — signup, login, magic links, email verification, password reset
2. ✅ **Database** — SQLite schema, Week 1 lesson seed, progress tracking
3. ✅ **Dashboard & Lessons** — wired to SQLite, 4-block lesson UI
4. ✅ **AI Roleplay Engine** — Groq Block 3 integration with credit gating
5. ✅ **Admin Dashboard** — health metrics, Kanban, E2E viewer, settings
6. ✅ **PWA** — manifest, service worker, install prompt, app icons
7. ✅ **Magic Link Auth** — passwordless login via Resend
8. ✅ **Credits System** — ledger UI + API + balance-gated AI calls
9. ✅ **Production Deployment** — PM2 with full env vars for prod/dev
10. 🔄 **Gamification** — milestone rewards, streak bonuses, credit top-up
11. 🔄 **Audio Recording** — MediaRecorder for Block 2 & 3
12. 🔄 **Vocabulary Bank** — `/vocabulary` page + API
13. 🔄 **User Profile** — `/profile` account settings
14. 🔄 **Placement Test** — level assessment at first login
15. 🔄 **50+ Days of Content** — Weeks 2–8 lesson generation
