import { db } from '$lib/server/db'
import { event, calendar, calendarMember } from '$lib/server/db/schema'
import { json, error } from '@sveltejs/kit'
import { eq, asc, and, or, like, inArray, gte, lte, isNotNull } from 'drizzle-orm'

import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals, url }) => {
  const session = await locals.auth()
  if (!session?.user?.id) {
    throw error(401, 'Unauthorized')
  }

  const searchQuery = url.searchParams.get('query')
  const startDateStr = url.searchParams.get('start')
  const endDateStr = url.searchParams.get('end')

  try {
    // 1. Get all calendar IDs the user has access to
    const members = await db
      .select({ calendarId: calendarMember.calendarId })
      .from(calendarMember)
      .where(eq(calendarMember.userId, session.user.id))

    const calendarIds = members.map((m) => m.calendarId)

    if (calendarIds.length === 0) {
      return json([])
    }

    // 2. Fetch events
    const conditions = [inArray(event.calendarId, calendarIds)]

    if (searchQuery) {
      conditions.push(
        or(
          like(event.title, `%${searchQuery}%`),
          like(event.description, `%${searchQuery}%`)
        )!
      )
    }

    if (startDateStr && endDateStr) {
      const start = new Date(startDateStr)
      const end = new Date(endDateStr)

      // Filter events that start before the query end date OR are recurring
      conditions.push(
        or(lte(event.startTime, end), isNotNull(event.recurrenceRule))!
      )
    }

    let query = db
      .select({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        lat: event.lat,
        lng: event.lng,
        locationAddress: event.locationAddress,
        placeId: event.placeId,
        startTime: event.startTime,
        endTime: event.endTime,
        type: event.type,
        calendarId: event.calendarId,
        recurrenceRule: event.recurrenceRule,
        exdates: event.exdates
      })
      .from(event)
      .where(and(...conditions))
      .orderBy(asc(event.startTime))

    const events = await query

    // In-memory filter for the bottom boundary (events ending before start)
    // Only if dates were provided
    let filteredEvents = events
    if (startDateStr && endDateStr) {
      const start = new Date(startDateStr)
      filteredEvents = events.filter((e) => {
        // Always include recurring events (expansion happens on frontend)
        if (e.recurrenceRule) return true

        const eEnd = e.endTime ? new Date(e.endTime) : new Date(e.startTime!)
        return eEnd >= start
      })
    }

    return json(filteredEvents)
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
      endTime,
      calendarId: requestedCalendarId,
      recurrenceRule
    } = body

    if (!title) throw error(400, 'Title is required')

    let targetCalendarId = requestedCalendarId

    // If no calendar specified, find primary
    if (!targetCalendarId) {
      const primary = await db.query.calendar.findFirst({
        where: and(
          eq(calendar.userId, session.user.id),
          eq(calendar.isPrimary, 1)
        )
      })
      if (primary) {
        targetCalendarId = primary.id
      } else {
        // Fallback: any calendar they own
        const member = await db.query.calendarMember.findFirst({
          where: and(
            eq(calendarMember.userId, session.user.id),
            eq(calendarMember.role, 'owner')
          )
        })
        if (member) targetCalendarId = member.calendarId
      }
    }

    if (!targetCalendarId) {
      throw error(400, 'No calendar found for this user')
    }

    // Verify permission
    const membership = await db.query.calendarMember.findFirst({
      where: and(
        eq(calendarMember.calendarId, targetCalendarId),
        eq(calendarMember.userId, session.user.id)
      )
    })

    if (!membership || membership.role === 'reader') {
      throw error(
        403,
        'You do not have permission to add events to this calendar'
      )
    }

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
      recurrenceRule: recurrenceRule || null,
      calendarId: targetCalendarId
      // userId is NOT set (deprecated)
    })

    const [newEvent] = await db.select().from(event).where(eq(event.id, id))

    return json(newEvent)
  } catch (e) {
    console.error('Events Create API Error:', e)
    const status =
      e instanceof Error && 'status' in (e as any) ? (e as any).status : 500
    const message = e instanceof Error ? e.message : 'Internal Server Error'
    throw error(status, message)
  }
}
