# AI Agent Rules & Guidelines

## 1. Project Overview

**Antigravity** is a calendar scheduler web application built with SvelteKit.

- **Vibe**: MapleStory-inspired, Warm Orange (`#FF8A00`), Modern, Round, Soft shadows.
- **Goals**: Intuitive UX, lightweight, visually premium.

## 2. Tech Stack (Strict)

- **Framework**: SvelteKit (App Router)
- **UI Engine**: Svelte 5 (Runes mode ONLY).
  - 🚫 NO legacy stores (`writable`, `readable`).
  - ✅ USE `$state`, `$derived`, `$effect`, `$props`.
- **Styling**: Tailwind CSS (v3).
  - Custom colors defined in `tailwind.config.js` (`maple-orange`).
- **Database**: Drizzle ORM + `better-sqlite3` (`local.db`).
  - **Naming Convention**: Table names and columns MUST use `snake_case`.
  - **Date Types**: Use `PROPER ISO8601 TEXT` strings for dates, NOT Integers.
- **Date Handling**: `date-fns`.
- **Components**: `flatpickr` for date inputs.

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
- **Interactions**: Modals should close on backdrop click.
- **Navigation**: Provide Year/Month jumps.

## 5. Environment Variables

- Manage secrets in `.env`.
- Do not commit `.env`. Commit `.env.example`.
