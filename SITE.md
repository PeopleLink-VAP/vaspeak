# VASpeak Site Architecture and Roadmap

## 1. Vision
VASpeak is a gamified, mobile-first, "Duolingo-like" English speaking confidence trainer for Vietnamese Virtual Assistants. It focuses on a daily 4-block lesson loop (Listening, Pattern Drilling, AI Roleplay, Emotional Reflection).

## 2. Target Audience
- Vietnamese Virtual Assistants (VAs) looking to improve spoken English confidence.
- Mobile-first users interacting through a Progressive Web App (PWA).

## 3. Stitch Project ID
`6048421559219016208`

## 4. Sitemap (Current)
- `[x]` `/` — Landing page with waitlist signup CTA
- `[x]` `/login` — Auth portal (login, register, forgot password, magic link)
- `[x]` `/auth/magic` — Magic link token verification handler
- `[x]` `/dashboard` — User dashboard (streak, credits, today's lesson CTA)
- `[x]` `/lesson/[day]` — Full 4-block lesson page (SQLite-backed, all blocks on one page)
- `[x]` `/credits` — Credits usage ledger and overview
- `[x]` `/admin` — Admin dashboard (password-protected)
- `[x]` `/admin/kanban` — Turso-backed Kanban progress board
- `[x]` `/admin/settings` — System health, DB status, env info
- `[x]` `/admin/e2e-testing` — Playwright recording viewer + run trigger
- `[ ]` `/vocabulary` — Vocabulary Bank (not yet built)
- `[ ]` `/profile` — User Profile & Account Settings (not yet built)
- `[ ]` `/placement-test` — Level assessment (not yet built)

## 5. API Routes
- `[x]` `/api/waitlist` — Waitlist signup
- `[x]` `/api/roleplay` — Groq AI roleplay (credit-gated)
- `[x]` `/api/progress` — Write user block completions
- `[x]` `/api/credits` — Credits ledger read/write
- `[ ]` `/api/vocabulary` — Vocab bank CRUD (not yet built)

## 6. PWA
- `[x]` `manifest.webmanifest` — App name, icons, theme colors
- `[x]` `service-worker.ts` — Offline caching strategy
- `[x]` Install prompt — `src/lib/pwa.ts` (SSR-safe, client-only)
- `[x]` App icons — VAP sunflower submark (192px, 512px, maskable)

## 7. Deployment
- **Production**: PM2 `vaspeak-prod` → port 19300 → `vaspeak.alphabits.team` (Cloudflare tunnel)
- **Dev/Beta**: PM2 `vaspeak-dev` → port 19301 → `vaspeak-beta.alphabits.team`
- **Config**: `web/ecosystem.config.cjs` (contains full env vars for prod process)
- **Auth secrets**: `.env` in `web/` (gitignored) + mirrored in `ecosystem.config.cjs`

## 8. Roadmap — Next Steps
- **Step 1:** Gamification — milestone rewards modal, streak bonuses, credit top-up screen.
- **Step 2:** Audio Recording — MediaRecorder for Block 2 drilling and Block 3 roleplay.
- **Step 3:** `/vocabulary` bank — view, add, search vocab words.
- **Step 4:** `/profile` — account settings, display name, native language, password change.
- **Step 5:** Placement test — short assessment at first login to set starting level.
- **Step 6:** 50+ days of lesson content — generate and seed Weeks 2–8.
