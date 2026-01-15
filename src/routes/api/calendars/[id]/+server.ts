import { db } from '$lib/server/db'
import { calendar, calendarMember } from '$lib/server/db/schema'
import { logger } from '$lib/logger'
import { json, error } from '@sveltejs/kit'
import { eq, and } from 'drizzle-orm'
import type { RequestHandler } from './$types'

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const session = await locals.auth()
  if (!session?.user?.id) throw error(401, 'Unauthorized')

  try {
    const body = await request.json()
    const { name, color } = body

    // Verify ownership
    const membership = await db.query.calendarMember.findFirst({
      where: and(
        eq(calendarMember.calendarId, params.id),
        eq(calendarMember.userId, session.user.id),
        eq(calendarMember.role, 'owner')
      )
    })

    if (!membership) throw error(403, 'Permission denied')

    await db
      .update(calendar)
      .set({
        name: name || undefined,
        color: color || undefined,
        updatedAt: new Date()
      })
      .where(eq(calendar.id, params.id))

    const updated = await db.query.calendar.findFirst({
      where: eq(calendar.id, params.id)
    })

    return json(updated)
  } catch (e) {
    logger.error('Calendars Update API Error:', { error: e })
    const status =
      e instanceof Error && 'status' in (e as any) ? (e as any).status : 500
    throw error(status, 'Internal Server Error')
  }
}

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const session = await locals.auth()
  if (!session?.user?.id) throw error(401, 'Unauthorized')

  try {
    // Verify ownership
    const membership = await db.query.calendarMember.findFirst({
      where: and(
        eq(calendarMember.calendarId, params.id),
        eq(calendarMember.userId, session.user.id),
        eq(calendarMember.role, 'owner')
      )
    })

    if (!membership) throw error(403, 'Permission denied')

    // Prevent deleting primary calendar?
    // Optionally check if isPrimary. For now, let's allow it but maybe warn?
    // Actually, good UX prevents deleting the last calendar.

    await db.delete(calendar).where(eq(calendar.id, params.id))

    return json({ success: true })
  } catch (e) {
    logger.error('Calendars Delete API Error:', { error: e })
    const status =
      e instanceof Error && 'status' in (e as any) ? (e as any).status : 500
    throw error(status, 'Internal Server Error')
  }
}
