# Project History & Status

## Completed Features

- **Project Setup**: SvelteKit + Tailwind + Drizzle + SQLite.
- **Database**: `Events` table (id, title, description, startTime, endTime, type, userId).
- **Calendar UI**:
  - Monthly grid view.
  - Year/Month dropdown navigation.
  - Event pills with type-based coloring (Schedule: Orange, Diary: Purple).
- **Event Management**:
  - Create/Edit/Delete actions.
  - `EventModal` with Backdrop close.
  - **Flatpickr** integration for date/time input.
  - `Schedule` vs `Diary` type selection.

## Current Architecture

- **Backend**: Server Actions in `+page.server.js` handle CRUD.
- **Frontend**: `CalendarGrid.svelte` and `EventModal.svelte` manage UI logic via `$state`.
- **Type Safety**: JSDoc used throughout.

## Pending/Next

- **Authentication**: Kakao Login implementation.
- **API Structuring**: Separation of concerns for clearer API routes.
