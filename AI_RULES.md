# AI Agent Rules & Guidelines

## 1. Project Overview

**Justodo** is a calendar scheduler & note-taking web application built with SvelteKit.

- **Vibe**: Sophisticated Evergreen green (`#059669`), Modern, Professional, Rounded (4px), Soft shadows.
- **Goals**: Intuitive UX, lightweight, visually premium.

## 2. Tech Stack (Strict)

- **Framework**: SvelteKit (App Router)
- **UI Engine**: Svelte 5 (Runes mode ONLY).
  - 🚫 NO legacy stores (`writable`, `readable`).
  - ✅ USE `$state`, `$derived`, `$effect`, `$props`.
- **Styling**: Tailwind CSS (v3).
  - Custom colors defined in `tailwind.config.js` (`justodo-green`).
- **Database**: Drizzle ORM + MySQL.
  - **Naming Convention**: Table names and columns MUST use `snake_case`.
  - **Date Types**: Use `Date` objects for `datetime`/`timestamp` columns in Drizzle (Drizzle handles conversion to/from MySQL format automatically).
- **Date Handling**: `dayjs`.
- **Components**: `flatpickr` for date inputs.
- **Client State**: `@tanstack/svelte-query` for data fetching and caching.

## 3. Coding Conventions

- **Files**: Use `+page.svelte`, `+page.server.js`, `+server.js` (Standard SvelteKit).
- **Imports**: Use `$lib` aliases.
- **Type Safety**: Use JSDoc annotations strictly for checking.
- **Async/Await**: Handle all DB operations asynchronously.
- **Formatting**:
  - **Strings**: Use single quotes (`'`) whenever possible (e.g., imports, attribute values).
  - **Semicolons**: Do NOT use semicolons at the end of statements.
  - **Indentation**: Use 2-space indentation (Tab size 2).

## 4. Feature constraints

- **Responsiveness**: Mobile-first or fully reactive layout.
- **Interactions**: Modals should close via 'X' button or explicit action (not backdrop click by default if it contains a form).
- **Navigation**: Provide Year/Month jumps.

## 5. Cleanup & Reliability

- **Ephemeral Scripts**: Do NOT leave migration, debug, or diagnostic scripts (e.g., `migrate_*.js`, `debug_*.js`) in the project root. Delete them automatically once verified.
- **Intermediate Files**: Files generated for checking output (e.g., `check_output*.txt`) must be added to `.gitignore` and deleted immediately after use.
- **Build Verification**: Ensure the production build (`npm run build`) is verified after significant changes.

## 6. Environment Variables

- Manage secrets in `.env`.
- Do not commit `.env`. Commit `.env.example`.

