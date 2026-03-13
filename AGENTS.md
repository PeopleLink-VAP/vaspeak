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
- **Backend / DB**: Serverless SvelteKit API routes. **Local SQLite (`libsql`)** replaces SpacetimeDB.
- **Auth**: Fully custom server-side auth. Email/password (bcrypt) + magic links (Resend). 7-day httpOnly JWT cookies handling session state.
- **AI Integration**: Groq API (Llama models) used for dynamic roleplay, pronunciation scoring, and dynamic lesson content generation.
- **System Management**: A dedicated admin settings area to view system health, last deployed status, and manage/backup the local SQLite `.db` file.

### Database Schema Shapes (SQLite / libsql)
- `profiles`: id, email, display_name, current_level, native_language.
- `user_credits`: user_id, monthly_allowance (100), credits_used, subscription_status, reset_date. *(Must check balance before Groq API calls).*
- `lessons`: id, day_number, week_theme, niche, title, content (JSON blocks).
- `user_progress`: user_id, lesson_id, block_completions (JSON), simulation_scores (JSON), reflection_notes.
- `vocabulary_bank`: user_id, word, definition, context_sentence.

## 3. Design & Styling Rules
**Aesthetics**: Mobile-first, friendly, rounded UI inheriting Virtual Assistant PRO's identity.
- **Primary Color**: Sunflower Gold `#F2A906` (Primary CTAs, Active States, Progress bars. *Never put white text on sunflower, always use navy text.*)
- **Secondary/Text Color**: Deep Navy `#1B365D` (Headings, secondary buttons, main text).
- **Background**: Warm White `#FFFBF1`. Cards use White `#FFFFFF`.
- **Typography**: `Plus Jakarta Sans` for Headings, `Inter` for Body.
- **Components**: Generously rounded cards (`border-radius: 16px`) with navy shadow. Hover states use sunflower glow. Buttons `radius: 6px`. No gratuitous animations (use `fade-in`, simple transforms).

## 4. Development & Testing Rules
- **DB Access**: API routes use `$lib/server/db.ts` to execute SQL via `@libsql/client`.
- **E2E Testing**: Playwright (`npx playwright test`). Test heavily on Mobile viewports (Pixel 5, iPhone 12 configs). Ensure touch interactions, audio buttons, and iOS Safari quirks are handled.
- **Audio/Web API**: Extensive reliance on Web Audio API and MediaRecorder. Pay attention to autoplay policies requiring user gestures.
- **Commands**: `npm run dev`, `npm run build`, `npm run test:unit`, `npx playwright test`.

## 5. Current Roadmap / Next Steps
1. ✅ **Tech Stack Pivot**: Strip out SpacetimeDB, wire up SQLite (`@libsql/client`).
2. 🔄 **Schema Setup**: Create and migrate the new SQLite tables (users, auth, progress, credits, vocab).
3. 🔄 **AI Roleplay Engine**: Build the core Groq API integration for Block 3 (Guided Simulation).
4. 🔄 **System Settings & DB Backups**: Build the admin dashboard for health metrics and SQLite database management.
5. 🔄 **PWA Mechanics**: Add service workers, manifest, and install prompts.
6. 🔄 **Gamification & Monetization**: Wire up the credit decrement system and Milestone rewards.
