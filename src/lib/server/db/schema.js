import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('user', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name'),
    email: text('email').unique(),
    emailVerified: text('email_verified'), // Int -> Text, Camel -> Snake
    image: text('image')
});

export const accounts = sqliteTable('account', {
    userId: text('user_id') // Camel -> Snake
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(), // Camel -> Snake
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state')
}, (account) => ({
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] })
}));

export const sessions = sqliteTable('session', {
    sessionToken: text('session_token').primaryKey(), // Camel -> Snake
    userId: text('user_id') // Camel -> Snake
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    expires: text('expires').notNull() // Int -> Text
});

export const verificationTokens = sqliteTable('verification_token', {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: text('expires').notNull() // Int -> Text
}, (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] })
}));

export const events = sqliteTable('events', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    description: text('description'),
    startTime: text('start_time'),
    endTime: text('end_time'),
    type: text('type').notNull().default('schedule'),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' })
});
