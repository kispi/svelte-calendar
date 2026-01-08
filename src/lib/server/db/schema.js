import { sqliteTable, text, integer, primaryKey, uniqueIndex } from 'drizzle-orm/sqlite-core'

const baseColumns = {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  deletedAt: text('deleted_at')
}

export const user = sqliteTable('users', {
  ...baseColumns,
  name: text('name'),
  email: text('email').unique(),
  emailVerified: text('email_verified'),
  image: text('image')
})

export const account = sqliteTable(
  'accounts',
  {
    ...baseColumns,
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state')
  },
  (account) => ({
    uniqueAccount: uniqueIndex('accounts_provider_provider_account_id_unique').on(
      account.provider,
      account.providerAccountId
    )
  })
)

export const session = sqliteTable('sessions', {
  ...baseColumns,
  sessionToken: text('session_token').unique().notNull(), // standard for Auth.js
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  expires: text('expires').notNull()
})

export const verificationToken = sqliteTable(
  'verification_tokens',
  {
    ...baseColumns,
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: text('expires').notNull()
  },
  (vt) => ({
    uniqueToken: uniqueIndex('verification_tokens_identifier_token_unique').on(
      vt.identifier,
      vt.token
    )
  })
)

export const event = sqliteTable('events', {
  ...baseColumns,
  title: text('title').notNull(),
  description: text('description'),
  startTime: text('start_time'),
  endTime: text('end_time'),
  type: text('type').notNull().default('schedule'),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' })
})


