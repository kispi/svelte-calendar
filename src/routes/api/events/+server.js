import { db } from '$lib/server/db'
import { event } from '$lib/server/db/schema'
import { json, error } from '@sveltejs/kit'
import { eq, asc } from 'drizzle-orm'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
  const session = await locals.auth()
  if (!session?.user?.id) {
    throw error(401, 'Unauthorized')
  }

  try {
    const allEvents = await db
      .select()
      .from(event)
      .where(eq(event.userId, session.user.id))
      .orderBy(asc(event.startTime))
      .all()
    return json(allEvents)
  } catch (e) {
    console.error('API Error:', e)
    throw error(500, 'Internal Server Error')
  }
}
