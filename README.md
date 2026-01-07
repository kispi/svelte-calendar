# Antigravity Calendar 📅

A modern, responsive personal calendar application built with SvelteKit. Manage your schedule effectively with a zero-gravity experience.

## ✨ Features

- **Monthly Calendar View**: Intuitive grid layout with easy navigation.
- **Event Management**: Create, read, update, and delete events.
- **Authentication**: Secure login via **Kakao** (Auth.js).
- **Event Types**: Categorize events (Schedule, Anniversary, etc.).
- **Responsive Design**: optimized for both desktop and mobile.
- **Date Picking**: Integrated `flatpickr` for easy date/time selection.

## 🛠 Tech Stack

- **Framework**: [SvelteKit 5](https://svelte.dev/) (Runes)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Database**: [SQLite](https://www.sqlite.org/) (via `better-sqlite3`)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Auth.js](https://authjs.dev/) (v5)
- **Deployment**: Node Adapter + PM2

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Kakao Developer Account (for OAuth)

### 1. Installation

```bash
git clone <repository-url>
cd svelte-calendar
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DB_PATH=local.db

# Auth.js
AUTH_SECRET=<generated_secret> # Generate with: npx auth secret

# Kakao OAuth
KAKAO_CLIENT_ID=<your_kakao_rest_api_key>
KAKAO_CLIENT_SECRET=<your_kakao_client_secret>
```

### 3. Database Setup

Initialize the SQLite database schema:

```bash
npx drizzle-kit push
```

### 4. Development

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

## 📦 Deployment (EC2 + PM2)

This project is configured for deployment using `@sveltejs/adapter-node` and `pm2`.

### Build

```bash
npm run build
```

This creates a standalone Node.js server in the `build/` directory.

### Run with PM2

Start or reload the application using the configured `ecosystem.config.cjs`:

```bash
# Start
npm run pm2:start

# Reload (Zero-downtime update)
npm run pm2:reload

# Deploy shortcut (Build + Reload)
npm run deploy
```

> **Note**: Update `ecosystem.config.cjs` with your actual `ORIGIN` (domain/IP) for proper Auth.js callback handling.

## 📂 Project Structure

- `src/lib/server/db`: Database schema and connection.
- `src/routes`: SvelteKit pages and API endpoints (server actions).
- `src/hooks.server.js`: Auth.js configuration and adapter wrapper.
- `local.db`: SQLite database file (gitignored).

## 📄 License

MIT
