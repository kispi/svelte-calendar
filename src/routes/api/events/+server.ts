import { db } from '$lib/server/db'
import { event, calendar, calendarMember } from '$lib/server/db/schema'
import { createEvent } from '$lib/server/events'
import { logger } from '$lib/logger'
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
    logger.error('API Error:', { error: e })
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
      calendarId,
      recurrenceRule
    } = body

    if (!title) throw error(400, 'Title is required')

    const newEvent = await createEvent(session.user.id, {
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
      recurrenceRule,
      calendarId
    })

    return json(newEvent)
  } catch (e) {
    logger.error('Events Create API Error:', { error: e })
    const status =
      e instanceof Error && 'status' in (e as any) ? (e as any).status : 500
    const message = e instanceof Error ? e.message : 'Internal Server Error'
    throw error(status, message)
  }
}
