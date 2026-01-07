import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';

const dbPath = env.DB_PATH || 'local.db';
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite);
