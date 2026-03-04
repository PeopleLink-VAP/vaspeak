# Development Guidelines

This document serves as the guide for humans and AI agents extending or maintaining **VASpeak**.

## Context & Key Architecture Decisions

- Lessons use **JSONB columns** in the Supabase backend for flexible block content (tasks, variations, steps) rather than separate relational tables per block type.
- There are **4 User Levels**: Survival Speaker → Working VA → Client Manager → Strategic Partner
- **Simulation Difficulties**: There are 3 difficulty modes for Guided Simulation: Practice, Real, Stress.
- **Weekly Themes**: Lessons group into weekly themes taking up 5 daily lessons.

## Tech & Framework Guidelines

1. **SvelteKit 5**: 
   - Utilize Svelte 5 Runes for properties and reactivity.
   - Svelte files must follow standard `+page.svelte`, `+layout.svelte`, and server hooks.
   
2. **Database interactions**:
   - Access the Supabase tables directly for now: `lessons`, `profiles`, `user_progress`. 
   - Observe Row-Level Security (RLS) policies - components interacting with lists/user info must properly pass auth tokens.

3. **Styling**:
   - The design system utilizes **Tailwind CSS**. 
   - Maintain the established gradient themes, custom CSS variables, and focus on delivering excellent dynamic animations (Framer Motion behavior equivalents for Svelte will be designed over time or migrated smoothly). Focus heavily on functional data flows first per the handoff sheet.

4. **Environment Variables**:
   - All server-side secrets should be prefixed appropriately or fetched via SvelteKit's `$env/dynamic/private`.
   - Ensure you read `.env.example` to know what to provide.

## Build & Deploy Cycle
- Verified builds: Use `npm run build` locally using `@sveltejs/adapter-netlify` before deploying. Netlify reads `netlify.toml` automatically.
