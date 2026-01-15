import {
  mysqlTable,
  varchar,
  text,
  int,
  double,
  index,
  primaryKey,
  uniqueIndex,
  timestamp,
  datetime,
  tinyint
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'

const baseColumns = {
  id: varchar('id', { length: 255 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow(),
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
    ...baseColumns,
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('provider_account_id', {
      length: 255
    }).notNull(),
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
    session_state: varchar('session_state', { length: 255 })
  },
  (account) => ({
    unq: uniqueIndex('accounts_unq').on(account.provider, account.providerAccountId)
  })
)

export const session = mysqlTable('sessions', {
  ...baseColumns,
  sessionToken: varchar('session_token', { length: 255 })
    .notNull()
    .unique(),
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull()
})

// verificationToken removed

export const calendar = mysqlTable('calendars', {
  ...baseColumns,
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 50 }).notNull().default('#3b82f6'),
  userId: varchar('user_id', { length: 255 }).references(() => user.id, {
    onDelete: 'cascade'
  }), // Owner/Creator convenience
  isPrimary: tinyint('is_primary').default(0)
})

export const calendarMember = mysqlTable(
  'calendar_members',
  {
    ...baseColumns,
    calendarId: varchar('calendar_id', { length: 255 })
      .notNull()
      .references(() => calendar.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 50 }).notNull().default('owner') // owner, writer, reader
  },
  (t) => ({
    calendarIdIdx: index('calendar_members_calendar_id_idx').on(t.calendarId),
    userIdIdx: index('calendar_members_user_id_idx').on(t.userId)
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

  // New Fields for Calendar Architecture
  calendarId: varchar('calendar_id', { length: 255 }).references(
    () => calendar.id,
    { onDelete: 'cascade' }
  ),

  // Recurrence Fields
  recurrenceRule: text('recurrence_rule'),
  exdates: text('exdates')
})

export const note = mysqlTable('notes', {
  ...baseColumns,
  title: varchar('title', { length: 255 }),
  content: text('content'),
  userId: varchar('user_id', { length: 255 }).references(() => user.id, {
    onDelete: 'cascade'
  })
})

export const eventShare = mysqlTable('event_shares', {
  ...baseColumns,
  eventId: varchar('event_id', { length: 255 })
    .notNull()
    .references(() => event.id, { onDelete: 'cascade' }),
  inviterId: varchar('inviter_id', { length: 255 }).notNull(), // User who invited
  inviteeEmail: varchar('invitee_email', { length: 255 }).notNull(),
  inviteeId: varchar('invitee_id', { length: 255 }), // Optional until they join
  status: varchar('status', { length: 50 }).default('pending'), // pending, accepted, rejected
  permissions: varchar('permissions', { length: 50 }).default('read') // read, write
})

export type User = InferSelectModel<typeof user>
export type NewUser = InferInsertModel<typeof user>

export type Account = InferSelectModel<typeof account>
export type NewAccount = InferInsertModel<typeof account>

export type Session = InferSelectModel<typeof session>
export type NewSession = InferInsertModel<typeof session>

export type Folder = InferSelectModel<typeof calendar>
export type NewFolder = InferInsertModel<typeof calendar>

export type Event = InferSelectModel<typeof event>
export type NewEvent = InferInsertModel<typeof event>

export type Note = InferSelectModel<typeof note>
export type NewNote = InferInsertModel<typeof note>

export const chatLog = mysqlTable('chat_logs', {
  ...baseColumns,
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  request: text('request'), // User's message
  response: text('response'), // AI's full response
  functionCalls: text('function_calls'), // JSON string of function calls made
  model: varchar('model', { length: 50 }),
  startTime: datetime('start_time'),
  duration: int('duration'), // in milliseconds
  isSuccess: tinyint('is_success').default(1),
})

export type ChatLog = InferSelectModel<typeof chatLog>
export type NewChatLog = InferInsertModel<typeof chatLog>
