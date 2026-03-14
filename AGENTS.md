# VASpeak - AI Agent Master Context

Compressed essential context for AI agents working on VASpeak.

## 1. Project Overview
VASpeak is a gamified, mobile-first, "Duolingo-like" English speaking confidence trainer for Vietnamese Virtual Assistants (VAs).
- **Core Loop**: Short daily 4-block lessons (Listening, Pattern Drilling, AI Roleplay, Emotional Reflection).
- **Niches**: General Communication → unlock 8 niche tracks (Ecommerce, Video Editor, Operations, etc.).
- **Gamification**: Monthly AI Credits (100/mo), milestones, daily challenges, vocabulary bank.
- **Platform**: SvelteKit PWA for mobile/desktop.
- **Language**: Primary UI language is Vietnamese (`lang="vi"` in `app.html`).

## 2. Tech Stack
- **Frontend**: SvelteKit 5 (Runes: `$state`, `$derived`, `$props`, `$effect`), TypeScript, Tailwind CSS 4.
- **Backend**: SvelteKit API routes. Local SQLite (`@libsql/client`). Admin Kanban via remote Turso.
- **Auth**: Custom server-side. Email/password (bcrypt) + magic links (Resend). 7-day httpOnly JWT. Anti-enumeration.
- **AI**: Groq API (Llama) for roleplay, pronunciation, content gen, Telegram vocab. Credit-gated.
- **Telegram**: `@vaspeak_bot` — daily vocab challenges, hourly cron, webhook at `/api/telegram/webhook`.
- **Icons**: `lucide-svelte` for admin, custom PNGs (`/static/icons/`) for app pages. No emoji in UI.
- **Admin**: 3-column layout (nav sidebar | content | activity panel). Light theme, Lucide icons.
- **Deploy**: PM2 self-hosted. `vaspeak-prod` :19300 → `vaspeak.alphabits.team`. `vaspeak-dev` :19301 → `vaspeak-beta.alphabits.team`. Adapter: `@sveltejs/adapter-node`.

### Database Schema (SQLite / libsql)
| Table | Key columns |
|---|---|
| `profiles` | id, email, display_name, email_verified, role, current_level, niche, streak_count, last_active_date |
| `auth_passwords` | user_id (FK), password_hash |
| `email_verifications` | id, user_id, email, code, expires_at |
| `password_resets` | id, user_id, token (unique), expires_at (1hr) |
| `magic_links` | id, user_id, token (unique), expires_at (15min), single-use |
| `user_credits` | user_id (PK), monthly_allowance (100), credits_used, subscription_status, reset_date |
| `credit_events` | id, user_id, delta, reason, created_at |
| `lessons` | id, day_number, week_number, week_theme, niche, title, content (JSON), is_published |
| `user_progress` | id, user_id, lesson_id, block_completions (JSON), simulation_scores (JSON), stress_level (1-3), completed_at |
| `vocabulary_bank` | id, user_id, word, definition, context_sentence, lesson_id, mastered (0/1) |
| `telegram_links` | user_id (PK), telegram_chat_id, telegram_username, reminder_hour, timezone |
| `telegram_challenges` | id, user_id, word, correct_index, options (JSON), answered, correct, credits_earned |
| `telegram_messages` | id, user_id, telegram_chat_id, direction, message_text, message_type |
| `newsletter_subscribers` | id, email (unique), source, subscribed_at |
| `blacklisted_domains` | id, domain (unique) |

### Key Routes
**App pages**: `/` (landing), `/login`, `/auth/magic`, `/dashboard`, `/lessons`, `/lesson/[day]`, `/credits`, `/vocabulary`, `/challenges`, `/profile`.

**Admin pages**: `/admin` (dashboard), `/admin/kanban`, `/admin/users`, `/admin/lessons`, `/admin/waitlist`, `/admin/e2e-testing`, `/admin/settings`.

**APIs**: `/api/roleplay`, `/api/progress`, `/api/credits`, `/api/waitlist`, `/api/telegram/link`, `/api/telegram/webhook`, `/api/telegram/send-daily-challenge`.

**Admin APIs**: `/admin/api/activity` (user signups/waitlist/progress), `/admin/api/kanban/activity` (task updates/comments), `/admin/api/kanban/tasks`, `/admin/api/users/[id]`.

## 3. Design System — "Editorial Chromeless"

### App Pages (mobile-first)
- **Philosophy**: Clean, chromeless, editorial. No card shadows. Hairline dividers. Typography-driven.
- **Page bg**: `#FAFAF8`, text: `#1A1A1A`, muted: `#A3A3A3`, accent: `#D4960A` (gold), success: `#10B981`.
- **Top bar**: `sticky top-0 bg-[#FAFAF8]/95 backdrop-blur-lg border-b border-[#E8E8E8]`.
- **Inputs**: Underline-only (`border-b`), never boxed. Labels: muted uppercase.
- **Modals**: Bottom-sheet on mobile, centered on desktop.
- **Icons**: Custom PNGs in `/static/icons/`, inline SVG for chrome. **Never emoji**.
- **Fonts**: Headings = `Plus Jakarta Sans`, body = `Inter`.

### Admin Pages (desktop-first, 3-column)
- **Layout**: `admin-shell` flex container → nav sidebar (240px) | main content (flex:1) | activity panel (300px, collapsible).
- **Colors**: bg `#f8f9fb`, cards `#ffffff` with `border: 1px solid #e8ecf1`, text `#1e293b`, muted `#94a3b8`, accent `#f2a906`.
- **Icons**: `lucide-svelte` library. Import specific icons, never use emoji.
- **Activity sidebar**: 3rd column, shows kanban activity by default, user activity on `/admin/users`. Collapsible to 48px. Hidden on <1024px. Auto-refreshes via `$effect` watching `$page.url.pathname`.
- **Timestamps**: SQLite stores UTC without `Z`. APIs normalize with `utc()` helper appending `Z`. Client uses `TimeAgo.svelte` component.
- **E2E recordings**: Carousel view (1/N) with prev/next, not grid dump.

### Shared Components
| Component | Location | Purpose |
|---|---|---|
| `BottomNav.svelte` | `$lib/components/` | App bottom navigation bar |
| `TimeAgo.svelte` | `$lib/components/` | Relative timestamp ("3m ago"), auto-updates, respects browser TZ |
| `TelegramConnect.svelte` | `$lib/components/` | Self-contained Telegram link/unlink/QR/timezone picker |
| `AudioRecorder.svelte` | `$lib/components/` | Web Audio capture for lesson blocks |

### Shared Stores
| Store | Location | Purpose |
|---|---|---|
| `adminActivity` | `$lib/stores/adminActivity.ts` | Activity sidebar open state + ActivityItem type |

## 4. Development Rules
- **DB**: `$lib/server/db.ts` (SQLite via libsql), `$lib/server/turso.ts` (admin Kanban remote).
- **Auth**: `$lib/server/auth.ts` (JWT/bcrypt), `$lib/server/email.ts` (Resend), `$lib/server/magic-link.ts`.
- **Credits**: `$lib/server/credits.ts` — `spendCredits()`, `earnCredits()`. Check balance before every Groq call.
- **Gamification**: `$lib/gamification.ts` — `checkMilestones`, `getNewMilestones`. 12 milestones defined.
- **Timestamp convention**: SQLite stores UTC without `Z` suffix. When serving to client, use `utc()` helper to append `Z` so `new Date()` parses correctly.
- **Svelte 5**: Runes mode only. Use `$state`, `$derived`, `$props`, `$effect`. No `<svelte:component>`, use direct `<Component />`.
- **E2E**: Playwright. Mobile viewports (Pixel 5, iPhone 12). Tests in `tests/e2e/`. Recordings at `/admin/e2e-testing`.
- **Commands**: `npm run dev`, `npm run build`, `npm run test:unit`, `npx playwright test`.
- **Deploy**: `npm run build && pm2 reload ecosystem.config.cjs --update-env`.

## 5. Roadmap
### ✅ Complete
1. SQLite stack, schema, auth (email/password + magic links)
2. Dashboard, lesson pages, AI roleplay engine (Groq, credit-gated)
3. Admin dashboard, Kanban (Turso), E2E viewer, settings
4. PWA (service worker, manifest, install prompt)
5. Credits system (ledger UI, API, balance checks)
6. PM2 deployment (prod :19300, dev :19301)
7. Gamification engine (12 milestones, streak bonuses, badges)
8. 49 days content (W1-3 manual, W4-7 AI-generated)
9. Vocabulary bank, placement test, Telegram bot integration
10. Custom icon system (PNG + Lucide), editorial chromeless redesign
11. Admin light theme, Lucide icons, 3-column layout with activity sidebar
12. Admin users page (tabbed profile popup: activity timeline, progress, credits)
13. Reusable `TimeAgo` component, UTC timestamp normalization
14. E2E carousel view for recordings/screenshots

### 🔄 In Progress
15. Audio recording polish (Web Audio + MediaRecorder, needs E2E testing)
16. Monetization (credit top-up, Pro plan, payment integration)
17. Community forum (social feature for VAs)
18. 50+ days content (extend beyond Week 7)
19. Niche-specific lesson generation (ecommerce, video_editor, etc.)
