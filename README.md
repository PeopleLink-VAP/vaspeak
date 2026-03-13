# VASpeak

## Overview

**VASpeak** is a mini-app site designed to serve as an English speaking confidence trainer for Virtual Assistants (VAs). It is part of the `vaspeak.virtualassistanpro.vn` project and offers 50+ days of lessons carefully structured around building real-world communication confidence.

### Lesson Flow

Each day completes a guided 4-block structure:

1. **Listening Decoding**
2. **Pattern Drilling**
3. **Guided Simulation**
4. **Emotional Reflection**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | SvelteKit 5, TypeScript, Tailwind CSS 4 |
| Database | **SQLite** (libsql) |
| Auth | SvelteKit API routes + bcrypt + JWT session cookies |
| Email | Resend API (verification, magic links, password reset) |
| Hosting | Self-hosted (Node adapter, PM2) |
| AI | Groq API (future features) |

---

## Getting Started

### Prerequisites

- Node.js v22+

### Setup

```bash
# 1. Install web app dependencies
cd web-app && npm install

# 2. Copy env file and fill in your values
cp .env.example .env

# 3. Initialize SQLite DB (run schema scripts if provided)
# ...

# 4. Start the dev server
npm run dev
```

### Project Structure

```
vaspeak/
├── server/               # SpacetimeDB module (TypeScript)
│   └── src/
│       └── index.ts      # Schema (6 tables) + reducers (11)
└── web-app/              # SvelteKit 5 app
    └── src/
        ├── hooks.server.ts           # Auth middleware
        ├── lib/
        │   └── server/
        │       ├── auth.ts           # JWT, bcrypt, cookies
        │       ├── email.ts          # Resend email integration
        │       ├── validation.ts     # Input validation + disposable domains
        │       └── db.ts             # SQLite (libsql) client connection
        └── routes/
            ├── api/auth/             # Auth API endpoints
            └── api/newsletter/       # Newsletter API endpoints
```

### Environment Variables (`.env`)

```bash
JWT_SECRET=""                 # min 32 chars, random
SITE_URL="http://localhost:5173"
RESEND_API_KEY=""
GROQ_API_KEY=""
GROQ_MODEL="meta-llama/llama-4-scout-17b-16e-instruct"
```

---

## Auth Features

- ✅ Email + password registration (with strength validation)
- ✅ Email verification (link sent via Resend)
- ✅ Login with JWT session cookie (httpOnly, 7-day)
- ✅ Forgot password / password reset (1-hour token)
- ✅ Magic link login (15-minute token, passwordless)
- ✅ Disposable email domain blocking (121K+ domains via `disposable-email-domains` npm package)
- ✅ Blacklisted domain DB table (admin-managed, in SQLite)
- ✅ Newsletter subscribe / unsubscribe
- ✅ Anti-enumeration (forgot-password/magic-link always return success)
- ✅ Self-hosted deployment setup

---

## Testing

```bash
# Unit tests (validation + auth utilities)
npm run test:unit

# E2E API tests (Playwright — requires dev server)
npx playwright test

# All tests: 32 unit + 27 E2E = 59 total, all passing
```

---

## Roadmap

1. ✅ **Authentication** — signup, login, magic links, email verification, password reset
2. **Lesson Data Fetching** — replace mockup with dynamic SQLite data
3. **Progress Tracking** — write `user_progress` on block completions
4. **Dashboard Reads** — wire streak, progress, upcoming lesson widgets
5. **50+ Days of Content** — validate and generate missing lessons
6. **Audio Recording** — Web Audio API + MediaRecorder
7. **Placement Test** — assessment logic for 4 user levels
8. **Audio Playback** — TTS / audio clips for lessons
