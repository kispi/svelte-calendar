# Antigravity Calendar 📅

A modern, responsive personal calendar application built with SvelteKit. Manage your schedule effectively with a zero-gravity experience.

## ✨ Features

- **Monthly Calendar View**: Intuitive grid layout with rich styling and MapleStory-inspired orange accents.
- **Event Management**: Full CRUD operations with modal-based creation and editing.
- **Authentication**: Secure **Kakao Login** using Auth.js (v5).
  - **Popup Flow**: Supports a seamless login experience via popup windows.
- **Categorized Events**: Different colors and styles for "Schedules" and "Anniversaries".
- **Responsive & Dynamic**: Fully optimized for mobile/tablet with touch-friendly interactions.
- **Advanced Form Controls**: Integrated `flatpickr` for precise date and time selection.

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
