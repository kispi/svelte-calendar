import Database from 'better-sqlite3'
const db = new Database('local.db')

const rows = db.prepare('SELECT * FROM user').all()
console.log('Users in DB:', rows)
