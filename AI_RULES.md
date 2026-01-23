# AI Agent Rules & Guidelines

## 1. Project Overview

This is a calendar scheduler & note-taking web application built with SvelteKit, included in gravex.app.

- **Vibe**: Sophisticated Evergreen green (`#6366F1`), Modern, Professional, Rounded (4px), Soft shadows.
- **Goals**: Intuitive UX, lightweight, visually premium.

## 2. Tech Stack (Strict)

- **Framework**: SvelteKit (App Router)
- **UI Engine**: Svelte 5 (Runes mode ONLY).
  - ?�� NO legacy stores (`writable`, `readable`).
  - ??USE `$state`, `$derived`, `$effect`, `$props`.
- **Styling**: Tailwind CSS (v3).
  - Custom colors defined in `tailwind.config.js` (`gravex-primary`).
- **Database**: Drizzle ORM + MySQL.
  - **Naming Convention**: Table names and columns MUST use `snake_case`.
  - **Date Types**: Use `Date` objects for `datetime`/`timestamp` columns in Drizzle (Drizzle handles conversion to/from MySQL format automatically).
- **Date Handling**: `dayjs`.
- **Components**: `flatpickr` for date inputs.
- **Client State**:
  - `@tanstack/svelte-query` for data fetching and caching.
  - **Settings Store**: Use `src/lib/settings.svelte.ts` for user preferences (tabs, locale, visibility). ? DO NOT use `localStorage` directly in components.

## 3. Coding Conventions

- **Files**: Use `+page.svelte`, `+page.server.js`, `+server.js` (Standard SvelteKit).
- **Imports**: Use `$lib` aliases.
- **Type Safety**: Use JSDoc annotations strictly for checking.
- **Async/Await**: Handle all DB operations asynchronously.
- **Formatting**:
  - **Strings**: Use single quotes (`'`) whenever possible (e.g., imports, attribute values).
  - **Semicolons**: Do NOT use semicolons at the end of statements.
  - **Indentation**: Use 2-space indentation (Tab size 2).
  - **Functions**: Always use Arrow Functions (`const foo = () => {}`) instead of `function` keyword, unless necessary for generators or specific scoping needs.

## 4. Feature constraints

- **Responsiveness**: Mobile-first or fully reactive layout.
- **Interactions**: Modals should close via 'X' button or explicit action (not backdrop click by default if it contains a form).
  - **Modal Implementation**: Modals MUST be implemented as standalone components in `src/lib/components/modals/`.
  - **Triggering**: Modals MUST be triggered via `modal.show(Component, props)`.
  - **Props**: Modals MUST accept a `close` prop (function) to resolve the promise.
- **Navigation**: Provide Year/Month jumps.

## 5. Cleanup & Reliability

- **Ephemeral Scripts**: Do NOT leave migration, debug, or diagnostic scripts (e.g., `migrate_*.js`, `debug_*.js`) in the project root. Delete them automatically once verified.
- **Intermediate Files**: Files generated for checking output (e.g., `check_output*.txt`) must be added to `.gitignore` and deleted immediately after use.
- **Build Verification**: Ensure the production build (`npm run build`) is verified after significant changes.

## 6. Environment Variables

- Manage secrets in `.env`.

## 7. REST API & Data Fetching

- **RESTful Endpoints**: Prefer RESTful API endpoints (`GET`, `POST`, `PUT`, `DELETE`) over legacy form actions for data operations.
- **JSON APIs**: Communication should happen via JSON `fetch` requests.
- **Response Handling**: APIs for `POST` and `PUT` SHOULD return the created/updated object as JSON.
- **Local State Sync**: After `POST`, `PUT`, or `DELETE`, manually update the client-side cache (e.g., `queryClient.setQueryData`) to reflect changes immediately.
- **No Redundant Fetches**: Avoid re-fetching the entire list (`invalidateQueries`) after individual CRUD operations if the result can be updated locally.
- **Conditional Fetching**: Queries should be `enabled` only for the active view or tab to minimize network traffic on load and tab switching.


## Internationalization (i18n) Rules

- **Never use inline ternary operators for locale checks in templates**
  - Bad: {i18n.locale === 'kr' ? 'Korean' : 'English'}
  - Good: {i18n.t('key.name')}

- **Always define translation keys in src/lib/i18n.svelte.ts**
  - Add keys to both en and kr translation objects
  - Use nested structure for organization (e.g., notes.noContent, common.save)

- **Use i18n.t() for all user-facing text**
  - Extract logic from templates into helper functions if needed
  - Keep templates clean and readable
