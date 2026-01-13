import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { env } from '$env/dynamic/private'
import * as schema from './schema'

const connection = await mysql.createPool({
    host: env.DB_HOST || 'webserver.coinsect.io',
    port: Number(env.DB_PORT) || 3306,
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD,
    database: env.DB_NAME || 'calendar',
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
})

export const db = drizzle(connection, { schema, mode: 'default' })
