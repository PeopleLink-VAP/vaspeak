# VASpeak

## Overview

**VASpeak** is a mini-app site designed to serve as an English speaking confidence trainer for Virtual Assistants (VAs). It is part of the `eskills.virtualassistanpro.vn` project and offers 50+ days of lessons carefully structured around building real-world communication confidence.

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
| Database | **SpacetimeDB** (remote maincloud, 2 environments) |
| Auth | SvelteKit API routes + bcrypt + JWT session cookies |
| Email | Resend API (verification, magic links, password reset) |
| Hosting | Netlify (adapter-netlify) |
| AI | Groq API (future features) |

---

## Getting Started

### Prerequisites
- Node.js v22+
- SpacetimeDB CLI — install: `curl -sSf https://install.spacetimedb.com | bash -s -- --yes`

### Setup
```bash
# 1. Install web app dependencies
cd web-app && npm install

# 2. Copy env file and fill in your values
cp .env.example .env

# 3. Add SpacetimeDB CLI to PATH (add to ~/.zshrc)
export PATH="/Users/$USER/.local/bin:$PATH"

# 4. Login to SpacetimeDB
spacetime login

# 5. Install and publish the server module
cd ../server && npm install
spacetime publish vaspeak-dev --project-path . --yes   # dev DB
spacetime publish vaspeak-prod --project-path . --yes  # prod DB

# 6. Seed disposable domain blocklist
spacetime call vaspeak-dev seed_blacklisted_domains '{}'

# 7. Generate TypeScript client bindings
spacetime generate --lang typescript \
  --out-dir ../web-app/src/lib/module_bindings \
  --project-path .

# 8. Start the dev server
cd ../web-app && npm run dev
```

### Project Structure
```
vaspeak/
├── server/               # SpacetimeDB module (TypeScript)
│   └── src/
│       ├── schema.ts     # Table definitions
│       └── index.ts      # Reducers
└── web-app/              # SvelteKit 5 app
    └── src/
        ├── hooks.server.ts           # Auth middleware
        ├── lib/
        │   ├── config.ts             # SpacetimeDB connection config
        │   └── server/
        │       ├── auth.ts           # JWT, bcrypt, cookies
        │       ├── email.ts          # Resend email integration
        │       ├── validation.ts     # Input validation + disposable domains
        │       └── spacetimedb.ts    # HTTP-based DB client (serverless)
        └── routes/
            ├── api/auth/             # Auth API endpoints
            └── api/newsletter/       # Newsletter API endpoints
```

### Environment Variables (`.env`)
```bash
PUBLIC_SPACETIMEDB_URI="wss://spacetimedb.com"
PUBLIC_SPACETIMEDB_MODULE="vaspeak-dev"   # or "vaspeak-prod"
SPACETIMEDB_TOKEN=""          # from spacetime login
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
- ✅ Disposable email domain blocking (~100 domains)
- ✅ Blacklisted domain DB table (admin-managed)
- ✅ Newsletter subscribe / unsubscribe
- ✅ Anti-enumeration (forgot-password/magic-link always return success)

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
2. **Lesson Data Fetching** — replace mockup with dynamic SpacetimeDB data
3. **Progress Tracking** — write `user_progress` on block completions
4. **Dashboard Reads** — wire streak, progress, upcoming lesson widgets
5. **50+ Days of Content** — validate and generate missing lessons
6. **Audio Recording** — Web Audio API + MediaRecorder
7. **Placement Test** — assessment logic for 4 user levels
8. **Audio Playback** — TTS / audio clips for lessons
