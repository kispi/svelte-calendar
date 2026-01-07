import Database from 'better-sqlite3'

const db = new Database('local.db')

// Enable foreign keys
db.pragma('foreign_keys = OFF')

console.log('Starting migration: Auth Tables -> Snake Case...')

db.transaction(() => {
  // === 1. USERS ===
  // emailVerified -> email_verified
  console.log('Migrating users...')
  db.prepare('ALTER TABLE user RENAME TO user_old').run()
  db.prepare(
    `
        CREATE TABLE user (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            email_verified TEXT,
            image TEXT
        )
    `
  ).run()
  const oldUsers = db.prepare('SELECT * FROM user_old').all()
  const insertUser = db.prepare(
    'INSERT INTO user (id, name, email, email_verified, image) VALUES (?, ?, ?, ?, ?)'
  )
  for (const u of oldUsers) {
    // Handle mixed types if necessary, currently assumed compatible or mapped
    let ev = u.emailVerified
    if (typeof ev === 'number') ev = new Date(ev).toISOString() // Convert if it was still int
    insertUser.run(u.id, u.name, u.email, ev, u.image)
  }
  db.prepare('DROP TABLE user_old').run()

  // === 2. ACCOUNTS ===
  // userId -> user_id, providerAccountId -> provider_account_id
  console.log('Migrating accounts...')
  db.prepare('ALTER TABLE account RENAME TO account_old').run()
  db.prepare(
    `
        CREATE TABLE account (
            user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
            type TEXT NOT NULL,
            provider TEXT NOT NULL,
            provider_account_id TEXT NOT NULL,
            refresh_token TEXT,
            access_token TEXT,
            expires_at INTEGER,
            token_type TEXT,
            scope TEXT,
            id_token TEXT,
            session_state TEXT,
            PRIMARY KEY (provider, provider_account_id)
        )
    `
  ).run()
  const oldAccounts = db.prepare('SELECT * FROM account_old').all()
  const insertAccount = db.prepare(`
        INSERT INTO account (user_id, type, provider, provider_account_id, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
  for (const a of oldAccounts) {
    insertAccount.run(
      a.userId,
      a.type,
      a.provider,
      a.providerAccountId,
      a.refresh_token,
      a.access_token,
      a.expires_at,
      a.token_type,
      a.scope,
      a.id_token,
      a.session_state
    )
  }
  db.prepare('DROP TABLE account_old').run()

  // === 3. SESSIONS ===
  // sessionToken -> session_token, userId -> user_id, expires (int) -> expires (text)
  console.log('Migrating sessions...')
  db.prepare('ALTER TABLE session RENAME TO session_old').run()
  db.prepare(
    `
        CREATE TABLE session (
            session_token TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
            expires TEXT NOT NULL
        )
    `
  ).run()
  const oldSessions = db.prepare('SELECT * FROM session_old').all()
  const insertSession = db.prepare(
    'INSERT INTO session (session_token, user_id, expires) VALUES (?, ?, ?)'
  )
  for (const s of oldSessions) {
    let exp = s.expires
    if (typeof exp === 'number') exp = new Date(exp).toISOString()
    insertSession.run(s.sessionToken, s.userId, exp)
  }
  db.prepare('DROP TABLE session_old').run()

  // === 4. VERIFICATION TOKENS ===
  // table: verificationToken -> verification_token
  // expires (int) -> expires (text)
  console.log('Migrating verification tokens...')
  // Check if table exists (it might not if unused)
  const vtExists = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='verificationToken'"
    )
    .get()
  if (vtExists) {
    db.prepare(
      'ALTER TABLE verificationToken RENAME TO verification_token_old'
    ).run()
    db.prepare(
      `
            CREATE TABLE verification_token (
                identifier TEXT NOT NULL,
                token TEXT NOT NULL,
                expires TEXT NOT NULL,
                PRIMARY KEY (identifier, token)
            )
        `
    ).run()
    const oldVT = db.prepare('SELECT * FROM verification_token_old').all()
    const insertVT = db.prepare(
      'INSERT INTO verification_token (identifier, token, expires) VALUES (?, ?, ?)'
    )
    for (const v of oldVT) {
      let exp = v.expires
      if (typeof exp === 'number') exp = new Date(exp).toISOString()
      insertVT.run(v.identifier, v.token, exp)
    }
    db.prepare('DROP TABLE verification_token_old').run()
  } else {
    // Create fresh if didn't exist
    db.prepare(
      `
            CREATE TABLE verification_token (
                identifier TEXT NOT NULL,
                token TEXT NOT NULL,
                expires TEXT NOT NULL,
                PRIMARY KEY (identifier, token)
            )
        `
    ).run()
  }

  console.log('Migration committed.')
})()

db.pragma('foreign_keys = ON')
console.log('Done.')
