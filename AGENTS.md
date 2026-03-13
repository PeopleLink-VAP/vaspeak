# VASpeak - AI Agent Master Context

This document provides the compressed, essential context for AI agents and human developers working on VASpeak.

## 1. Project Overview & Gamification Pivot
VASpeak is a gamified, mobile-first, "Duolingo-like" English speaking confidence trainer for Vietnamese Virtual Assistants (VAs).
- **Core Loop**: Short, daily, 4-block lessons (Listening, Pattern Drilling, AI Roleplay, Emotional Reflection). Emphasizes speaking/listening over reading/writing.
- **Niches**: Users start in General Communication. Unlocking 'Working VA' level unlocks 8 specific niche tracks (Ecommerce, Video Editor, Operations, etc.).
- **Gamification**: Users get monthly AI Credits (e.g., 100/mo). Earning milestones unlocks rewards and templates. Includes daily challenges, vocabulary bank, and a community forum.
- **Platform**: SvelteKit web app, structured as a Progressive Web App (PWA) for native-like installation and mobile/desktop reminders.

## 2. Tech Stack & Architecture
- **Frontend**: SvelteKit 5 (Using Runes exclusively: `$state`, `$derived`, `$props`), TypeScript, Tailwind CSS 4.
- **Backend / DB**: Serverless SvelteKit API routes. **Local SQLite (`libsql`)** replaces SpacetimeDB. Admin Kanban board uses a remote **Turso** database.
- **Auth**: Fully custom server-side auth. Email/password (bcrypt) + magic links (Resend). 7-day httpOnly JWT cookies. Anti-enumeration on all sensitive flows. Email verification enforced on password login.
- **AI Integration**: Groq API (Llama models) used for dynamic roleplay (Block 3), pronunciation scoring, and lesson content generation. Credit balance is checked before every Groq call.
- **System Management**: Admin dashboard at `/admin` with health metrics, PM2 status, Kanban board (Turso-backed), E2E recording viewer, and settings page.
- **Deployment**: Self-hosted via PM2. `vaspeak-prod` on port 19300 → `vaspeak.alphabits.team`. `vaspeak-dev` on port 19301 → `vaspeak-beta.alphabits.team`. Both managed by `ecosystem.config.cjs`. Production uses `@sveltejs/adapter-node` (`node build/index.js`).

### Database Schema Shapes (SQLite / libsql)
- `profiles`: id, email, display_name, email_verified (0/1), role ('user'|'admin'), current_level, niche, native_language, streak_count, last_active_date, created_at, updated_at.
- `auth_passwords`: user_id (FK→profiles), password_hash.
- `email_verifications`: id, user_id, email, code, expires_at. *(Token for email verification flow — not yet wired to sending.)*
- `password_resets`: id, user_id, token (unique), expires_at (1hr).
- `magic_links`: id, user_id, token (unique), expires_at (15min). *(Single-use, consumed on verify.)*
- `user_credits`: user_id (PK), monthly_allowance (100), credits_used, subscription_status ('free'|'pro'), reset_date. *(Check balance before every Groq call.)*
- `credit_events`: id, user_id, delta (negative=spent, positive=earned), reason ('roleplay'|'daily_bonus'|'milestone'), created_at. *(Written by spendCredits() and earnCredits() in $lib/server/credits.ts.)*
- `lessons`: id, day_number, week_number, week_theme, niche ('general'|'ecommerce'|'video_editor'|etc.), title, content (JSON blocks array), is_published, created_at, updated_at.
- `user_progress`: id, user_id, lesson_id, block_completions (JSON), simulation_scores (JSON), stress_level (1-3), reflection_notes, completed_at. UNIQUE(user_id, lesson_id).
- `vocabulary_bank`: id, user_id, word, definition, context_sentence, lesson_id, mastered (0/1), added_at.
- `newsletter_subscribers`: id, email (unique), source ('landing'|'app'), subscribed_at.
- `blacklisted_domains`: id, domain (unique), added_at. *(Admin-managed disposable email domain block list — not yet enforced in code.)*

### Key Routes
- `/` — Landing page + waitlist
- `/login` — Login, register, forgot password, magic link
- `/auth/magic` — Magic link token verification
- `/dashboard` — User dashboard (streak, credits, today's lesson CTA)
- `/lesson/[day]` — Full 4-block lesson page (SQLite-backed)
- `/credits` — Credits overview and usage ledger
- `/admin` — Admin dashboard (password-protected)
- `/admin/kanban` — Turso-backed Kanban board
- `/admin/settings` — System health, DB status, env info
- `/admin/e2e-testing` — Playwright recording viewer + run trigger
- `/api/roleplay` — Groq AI roleplay endpoint (credit-gated)
- `/api/progress` — User progress write endpoint
- `/api/credits` — Credits ledger API
- `/api/waitlist` — Waitlist signup endpoint

## 3. Design & Styling Rules
**Aesthetics**: Mobile-first, friendly, rounded UI inheriting Virtual Assistant PRO's identity.
- **Primary Color**: Sunflower Gold `#F2A906` (Primary CTAs, Active States, Progress bars. *Never put white text on sunflower, always use navy text.*)
- **Secondary/Text Color**: Deep Navy `#1B365D` (Headings, secondary buttons, main text).
- **Background**: Warm White `#FFFBF1`. Cards use White `#FFFFFF`.
- **Typography**: `Plus Jakarta Sans` for Headings, `Inter` for Body.
- **Components**: Generously rounded cards (`border-radius: 16px`) with navy shadow. Hover states use sunflower glow. Buttons `radius: 6px`. No gratuitous animations (use `fade-in`, simple transforms).

## 4. Development & Testing Rules
- **DB Access**: API routes use `$lib/server/db.ts` for SQLite via `@libsql/client` and `$lib/server/turso.ts` for admin Kanban via Turso remote.
- **Auth Helpers**: `$lib/server/auth.ts` (JWT, bcrypt), `$lib/server/email.ts` (Resend), `$lib/server/magic-link.ts` (token gen/verify), `$lib/server/credits.ts` (balance checks), `$lib/server/groq.ts` (Groq API wrapper).
- **E2E Testing**: Playwright (`npx playwright test`). Test heavily on Mobile viewports (Pixel 5, iPhone 12 configs). E2E recordings visible in `/admin/e2e-testing`.
- **Audio/Web API**: Extensive reliance on Web Audio API and MediaRecorder. Pay attention to autoplay policies requiring user gestures.
- **PWA**: `manifest.webmanifest` in `/static`, `service-worker.ts` at `src/`, install prompt logic in `src/lib/pwa.ts` (SSR-safe, client-only).
- **Commands**: `npm run dev`, `npm run build`, `npm run test:unit`, `npx playwright test`.
- **PM2**: `pm2 reload ecosystem.config.cjs --update-env` to reload prod/dev with latest env vars.

## 5. Current Roadmap / Next Steps
1. ✅ **Tech Stack Pivot**: Strip out SpacetimeDB, wire up SQLite (`@libsql/client`).
2. ✅ **Schema Setup**: SQLite tables created — users, auth tokens, progress, credits, vocab, lessons (Week 1 seeded).
3. ✅ **Auth System**: Full email/password + magic link auth, JWT session cookies, route guards, disposable email blocking.
4. ✅ **Dashboard & Lesson Pages**: `/dashboard` and `/lesson/[day]` wired to SQLite with real progress tracking.
5. ✅ **AI Roleplay Engine**: Groq API integration for Block 3 (Guided Simulation) with credit gating.
6. ✅ **Admin Dashboard**: `/admin` with health metrics, Kanban (Turso), E2E viewer, and settings page.
7. ✅ **PWA Mechanics**: Service worker, `manifest.webmanifest`, install prompt, VAP app icons.
8. ✅ **Magic Link Auth**: Passwordless login via emailed token (Resend), 15-min expiry, anti-enumeration.
9. ✅ **Credits System**: Credit ledger UI at `/credits`, API at `/api/credits`, balance checked before AI calls.
10. ✅ **Production Deployment**: PM2 `ecosystem.config.cjs` with full env vars for both prod (19300) and dev (19301) processes.
11. 🔄 **Gamification & Monetization**: Wire up milestone rewards, streak bonuses, and credit top-up flow.
12. 🔄 **50+ Days of Content**: Generate and validate remaining lesson content beyond Week 1.
13. 🔄 **Audio Recording**: Web Audio API + MediaRecorder for Block 2 (Pattern Drilling) and Block 3 (Roleplay).
14. 🔄 **Vocabulary Bank**: UI and API for user vocab at `/vocabulary`.
15. 🔄 **Placement Test**: Assessment logic determining starting level (Beginner / Working VA / Advanced).
