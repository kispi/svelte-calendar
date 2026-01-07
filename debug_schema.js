import Database from 'better-sqlite3'
const db = new Database('local.db')

console.log('=== Table: user ===')
console.log(db.pragma('table_info(user)'))

console.log('\n=== Table: account ===')
console.log(db.pragma('table_info(account)'))

console.log('\n=== Table: session ===')
console.log(db.pragma('table_info(session)'))
