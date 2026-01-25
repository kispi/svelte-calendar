import { db } from '$lib/server/db'
import { calendar, calendarMember } from '$lib/server/db/schema'
import { logger } from '$lib/logger'
import { json, error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals }) => {
  const session = await locals.auth()
  if (!session?.user?.id) throw error(401, 'Unauthorized')

  try {
    // Fetch calendars where user is a member
    const calendars = await db
      .select({
        id: calendar.id,
        name: calendar.name,
        color: calendar.color,
        isPrimary: calendar.isPrimary,
        ownerId: calendar.userId,
        role: calendarMember.role
      })
      .from(calendar)
      .innerJoin(calendarMember, eq(calendar.id, calendarMember.calendarId))
      .where(eq(calendarMember.userId, session.user.id))

    return json(calendars)
  } catch (e) {
    logger.error('Calendars List API Error:', { error: e })
    throw error(500, 'Internal Server Error')
  }
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = await locals.auth()
  if (!session?.user?.id) throw error(401, 'Unauthorized')

  // Explicitly capture userId to satisfy TS in closure
  const userId = session.user.id

  try {
    const body = await request.json()
    const { name, color } = body

    if (!name) throw error(400, 'Name is required')

    const id = crypto.randomUUID()

    // Transaction: Create Calendar + Add Member
    await db.transaction(async (tx) => {
      await tx.insert(calendar).values({
        id,
        name,
        color: color || '#3b82f6',
        userId: userId,
        isPrimary: 0
      })

      await tx.insert(calendarMember).values({
        calendarId: id,
        userId: userId,
        role: 'owner'
      })
    })

    const newCalendar = await db.query.calendar.findFirst({
      where: eq(calendar.id, id)
    })

    return json(newCalendar)
  } catch (e) {
    logger.error('Calendars Create API Error:', { error: e })
    throw error(500, 'Internal Server Error')
  }
}
