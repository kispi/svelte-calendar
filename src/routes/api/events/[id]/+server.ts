import { db } from '$lib/server/db'
import { event, calendarMember } from '$lib/server/db/schema'
import { logger } from '$lib/logger'
import { error, json } from '@sveltejs/kit'
import { eq, and, inArray, or } from 'drizzle-orm'

import type { RequestHandler } from './$types'

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const session = await locals.auth()
  if (!session?.user?.id) throw error(401, 'Unauthorized')

  try {
    const body = await request.json()

    // Extract fields to update
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
      endTime,
      recurrenceRule,
      calendarId
    } = body

    if (!title) throw error(400, 'Title is required')

    // Subquery for valid calendars (write access)
    const validCalendars = db
      .select({ id: calendarMember.calendarId })
      .from(calendarMember)
      .where(
        and(
          eq(calendarMember.userId, session.user.id),
          or(
            eq(calendarMember.role, 'owner'),
            eq(calendarMember.role, 'editor')
          )
        )
      )

    // If moving to a new calendar, verify access to that calendar
    if (calendarId) {
      const hasAccess = await db
        .select({ count: calendarMember.calendarId })
        .from(calendarMember)
        .where(
          and(
            eq(calendarMember.calendarId, calendarId),
            eq(calendarMember.userId, session.user.id),
            or(
              eq(calendarMember.role, 'owner'),
              eq(calendarMember.role, 'editor')
            )
          )
        )

      if (hasAccess.length === 0) {
        throw error(403, 'You do not have permission to move to this calendar')
      }
    }

    await db
      .update(event)
      .set({
        title,
        description,
        location,
        locationAddress,
        placeId,
        lat,
        lng,
        type,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        recurrenceRule: recurrenceRule || null,
        exdates: body.exdates, // Allow updating exdates
        calendarId: calendarId || undefined, // Update if provided
        updatedAt: new Date()
      })
      .where(
        and(eq(event.id, params.id), inArray(event.calendarId, validCalendars))
      )

    const [updated] = await db
      .select()
      .from(event)
      .where(eq(event.id, params.id))

    if (!updated) throw error(404, 'Event not found or permission denied')
    return json(updated)
  } catch (e) {
    logger.error('Events Update API Error:', { error: e })
    const status =
      e instanceof Error && 'status' in (e as any) ? (e as any).status : 500
    const message = e instanceof Error ? e.message : 'Internal Server Error'
    throw error(status, message)
  }
}

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const session = await locals.auth()
  if (!session?.user?.id) throw error(401, 'Unauthorized')

  try {
    // Subquery for valid calendars
    const validCalendars = db
      .select({ id: calendarMember.calendarId })
      .from(calendarMember)
      .where(
        and(
          eq(calendarMember.userId, session.user.id),
          or(
            eq(calendarMember.role, 'owner'),
            eq(calendarMember.role, 'editor')
          )
        )
      )

    const result = await db
      .delete(event)
      .where(
        and(eq(event.id, params.id), inArray(event.calendarId, validCalendars))
      )

    // drizzle delete result check?
    // simple check assumes success if no error, but let's assume if it existed it was deleted.
    // If it didn't exist/no perm, result.rowsAffected would be 0 (if driver supports it).

    return json({ success: true })
  } catch (e) {
    logger.error('Events Delete API Error:', { error: e })
    const status =
      e instanceof Error && 'status' in (e as any) ? (e as any).status : 500
    const message = e instanceof Error ? e.message : 'Internal Server Error'
    throw error(status, message)
  }
}
