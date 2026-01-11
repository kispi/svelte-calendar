# Justodo 📅

A modern, responsive personal calendar and notes application built with SvelteKit. Manage your schedule effectively with a seamless and professional experience.

## ✨ Features

- **Monthly Calendar View & Notes**: Intuitive layout with rich styling and sophisticated Evergreen green accents.
- **Event Management**: Full CRUD operations with modal-based creation and editing.
- **Authentication**: Secure **Kakao Login** using Auth.js (v5).
  - **Popup Flow**: Supports a seamless login experience via popup windows.
- **Categorized Events**: Different colors and styles for "Schedules" and "Anniversaries".
- **Responsive & Dynamic**: Fully optimized for mobile/tablet with touch-friendly interactions.
- **Advanced Form Controls**: Integrated `flatpickr` for precise date and time selection.

### 1. Simple Sync (Recommended for Dev)
If you just want to quickly sync your local database with the schema changes:
```bash
npx drizzle-kit push
```
> [!NOTE]
> `push` is the fastest way to sync schema during development. It ignores the migration history and applies changes directly to the database.

### 2. Formally Generating Migrations
Whenever you modify `src/lib/server/db/schema.js` and want to track it for production:
```bash
npx drizzle-kit generate
```
This creates a SQL migration file in the `drizzle` folder.

### 3. Applying Migrations (Production)
To apply the changes to your production database:
```bash
npx drizzle-kit migrate
```

> [!WARNING]
> 만약 제가 직접 마이그레이션 스크립트를 실행해 드린 경우, DB는 이미 최신 상태이지만 `drizzle-kit`의 마이그레이션 이력에는 기록되지 않았을 수 있습니다. 이럴 때는 `npx drizzle-kit push` 명령어를 사용하여 강제로 싱크를 맞추는 것이 가장 안전합니다.


---

## 🛠 Tech Stack

- **Framework**: [SvelteKit 5](https://svelte.dev/) (utilizing Runes for state management)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Database**: [SQLite](https://www.sqlite.org/) (Better-SQLite3)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Auth.js](https://authjs.dev/) (Customized Drizzle Adapter)
- **Deployment**: [Node Adapter](https://svelte.dev/docs/kit/adapter-node) + PM2

## 💾 Database Design

The database schema is standardized for readability and cross-platform compatibility:

- **Naming Convention**: All tables and columns use `snake_case` (e.g., `user_id`, `created_at`).
- **Date Storage**: Dates and times are stored as **ISO 8601 TEXT strings** (`YYYY-MM-DDTHH:mm:ss.sssZ`). This ensures:
  - Better readability when inspecting the database.
  - Consistent timezone handling.
  - Easier migration to other databases (PostgreSQL, MySQL, etc.) in the future.

## 🚀 Getting Started

### 1. Installation

```bash
git clone <repository-url>
cd svelte-calendar
npm install
```

### 2. Environment Setup

Create a `.env` file in the root:

```env
DB_PATH=local.db
AUTH_SECRET=<your_generated_secret> # npx auth secret
KAKAO_CLIENT_ID=<kakao_rest_api_key>
KAKAO_CLIENT_SECRET=<kakao_client_secret>
```

### 3. Initialize Database

Apply the schema to your local SQLite database:

```bash
npx drizzle-kit push
```

### 4. Run Development

```bash
npm run dev
```

## 📦 Deployment (EC2)

The project is configured for deployment using `@sveltejs/adapter-node`.

### Build the App

```bash
npm run build
```

This creates a standalone Node.js server in the `build/` directory.

### Run in Production

We use `dotenv` to load environment variables from a `.env` file in production:

```bash
# Start directly
npm start

# Using PM2 (Recommended)
pm2 start npm --name "svelte-calendar" -- start
```

> [!NOTE]
> Ensure `.env` is present in the production directory with correct `ORIGIN` and `PORT` values.

## 📄 License

MIT
