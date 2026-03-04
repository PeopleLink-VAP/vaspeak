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

This project uses a modern web stack:

- **Frontend**: SvelteKit 5 (React logic will be migrated to Svelte 5 equivalents), TypeScript, Tailwind CSS
- **Database Backend**: Supabase (currently partially completed via `lessons`, `profiles`, and `user_progress` tables).
- **Hosting**: Netlify
- **Key External APIs**:
  - Resend (Email)
  - Grok API (Future AI capabilities)
  - SpacetimeDB 2 (Future foundational storage)

---

## Getting Started

### Prerequisites
- Node.js (v20+ recommended, developed on v22)
- npm or pnpm

### Setup
1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in API keys
4. Start the dev server: `npm run dev`

### Project Structure
- `/src/routes` - SvelteKit pages and API endpoints. 
- `/src/lib` - Shared components and utilities.

## Roadmap & Features to Implement

According to the initial project brief, the frontend features need wiring up with real logic and database operations (Priority Order):

1. **Authentication** — Signup, login, protected routes interacting with Supabase RLS.
2. **Lesson Data Fetching** — Replace the `/lesson/:id` mockup with dynamic data from the `lessons` table.
3. **Progress Tracking Writes** — Implement writing to `user_progress` with block completions, stress levels, and scores.
4. **Dashboard Reads from DB** — Wire up streak, progress, and upcoming lesson widgets.
5. **Complete 50+ days of content** — Validate and generate missing lessons.
6. **Audio Recording (Web Audio API)** — Recording integration with MediaRecorder logic.
7. **Placement Test Logic** — Replace mock `/placement` flows with an assessment logic script checking for one of 4 user levels.
8. **Audio Playback** — Provide playback mechanisms (TTS/Audio clips) for lessons.
