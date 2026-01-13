import { mysqlTable, varchar, text, int, double, primaryKey, uniqueIndex, timestamp, datetime } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'

const baseColumns = {
  id: varchar('id', { length: 255 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  deletedAt: timestamp('deleted_at')
}

export const user = mysqlTable('users', {
  ...baseColumns,
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique(),
  emailVerified: timestamp('email_verified'),
  image: text('image')
})

export const account = mysqlTable(
  'accounts',
  {
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 255 }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: int('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 }),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
    deletedAt: timestamp('deleted_at')
  },
  (account) => ({
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] })
  })
)

export const session = mysqlTable('sessions', {
  sessionToken: varchar('session_token', { length: 255 }).notNull().primaryKey(),
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  deletedAt: timestamp('deleted_at')
})

export const verificationToken = mysqlTable(
  'verification_tokens',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires').notNull(),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
    deletedAt: timestamp('deleted_at')
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] })
  })
)

export const event = mysqlTable('events', {
  ...baseColumns,
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 255 }),
  // Location fields - Detailed
  lat: double('lat'),
  lng: double('lng'),
  locationAddress: varchar('location_address', { length: 512 }),
  placeId: varchar('place_id', { length: 255 }), // Kakao Place ID
  startTime: datetime('start_time'),
  endTime: datetime('end_time'),
  type: varchar('type', { length: 50 }).notNull().default('schedule'),
  userId: varchar('user_id', { length: 255 }).references(() => user.id, { onDelete: 'set null' })
})

export const note = mysqlTable('notes', {
  ...baseColumns,
  title: varchar('title', { length: 255 }),
  content: text('content'),
  userId: varchar('user_id', { length: 255 }).references(() => user.id, { onDelete: 'cascade' })
})

export type User = InferSelectModel<typeof user>
export type NewUser = InferInsertModel<typeof user>

export type Account = InferSelectModel<typeof account>
export type NewAccount = InferInsertModel<typeof account>

export type Session = InferSelectModel<typeof session>
export type NewSession = InferInsertModel<typeof session>

export type VerificationToken = InferSelectModel<typeof verificationToken>
export type NewVerificationToken = InferInsertModel<typeof verificationToken>

export type Event = InferSelectModel<typeof event>
export type NewEvent = InferInsertModel<typeof event>

export type Note = InferSelectModel<typeof note>
export type NewNote = InferInsertModel<typeof note>
