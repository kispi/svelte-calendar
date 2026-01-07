import Database from 'better-sqlite3'

const db = new Database('local.db')

// Enable foreign keys
db.pragma('foreign_keys = OFF')

console.log('Starting migration: Integer Timestamps -> ISO Text...')

// 1. Transaction to ensure safety
const migrate = db.transaction(() => {
  // 2. Rename old table
  db.prepare('ALTER TABLE events RENAME TO events_old').run()

  // 3. Create new table with TEXT definitions
  db.prepare(
    `
        CREATE TABLE events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            start_time TEXT,
            end_time TEXT,
            type TEXT DEFAULT 'schedule' NOT NULL,
            user_id TEXT,
            FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL
        )
    `
  ).run()

  // 4. Move data
  const oldEvents = db.prepare('SELECT * FROM events_old').all()

  // Explicit statement to allow manual Date conversion code
  const insert = db.prepare(`
        INSERT INTO events (id, title, description, start_time, end_time, type, user_id)
        VALUES (@id, @title, @description, @start_time, @end_time, @type, @user_id)
    `)

  let count = 0
  for (const ev of oldEvents) {
    // Convert timestamp (ms) to ISO String
    const start = ev.start_time ? new Date(ev.start_time).toISOString() : null
    const end = ev.end_time ? new Date(ev.end_time).toISOString() : null

    insert.run({
      id: ev.id,
      title: ev.title,
      description: ev.description,
      start_time: start,
      end_time: end,
      type: ev.type,
      user_id: ev.user_id
    })
    count++
  }

  // 5. Cleanup
  db.prepare('DROP TABLE events_old').run()

  console.log(`Migrated ${count} events.`)
})

try {
  migrate()
  db.pragma('foreign_keys = ON')
  console.log('Migration successful!')
} catch (err) {
  console.error('Migration failed:', err)
  process.exit(1) // Exit with error code
}
