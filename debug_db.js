import { db } from './src/lib/server/db/index.js'
import { users, events } from './src/lib/server/db/schema.js'

async function check() {
  console.log('=== Users ===')
  const allUsers = await db.select().from(users).all()
  console.log(allUsers)

  console.log('\n=== Events ===')
  const allEvents = await db.select().from(events).all()
  console.log(allEvents)
}

check()
