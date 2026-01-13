import { db } from '$lib/server/db'
import { event } from '$lib/server/db/schema'
import { json, error } from '@sveltejs/kit'
import { eq, asc } from 'drizzle-orm'

import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals }) => {
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
    return json(allEvents)
  } catch (e) {
    console.error('API Error:', e)
    throw error(500, 'Internal Server Error')
  }
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = await locals.auth()
  if (!session?.user?.id) throw error(401, 'Unauthorized')

  try {
    const body = await request.json()
    const {
      title,
      description,
      location,
      locationAddress,
      placeId,
      lat,
      lng,
      type,
      startTime,
      endTime
    } = body

    if (!title) throw error(400, 'Title is required')

    const id = crypto.randomUUID()
    await db.insert(event).values({
      id,
      title,
      description,
      location,
      locationAddress,
      placeId,
      lat,
      lng,
      type: type || 'schedule',
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      userId: session.user.id
    })

    const [newEvent] = await db
      .select()
      .from(event)
      .where(eq(event.id, id))

    return json(newEvent)
  } catch (e) {
    console.error('Events Create API Error:', e)
    const status = e instanceof Error && 'status' in (e as any) ? (e as any).status : 500
    const message = e instanceof Error ? e.message : 'Internal Server Error'
    throw error(status, message)
  }
}
