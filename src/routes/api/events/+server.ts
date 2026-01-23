import { db } from '$lib/server/db'
import { event, calendar, calendarMember } from '$lib/server/db/schema'
import { logger } from '$lib/logger'
import { json, error } from '@sveltejs/kit'
import { eq, asc, and, or, like, inArray, gte, lte, isNotNull } from 'drizzle-orm'
import { holidays, getLunarHolidays } from '$lib/holidays'

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

    // Inject Holidays (Fixed & Lunar)
    // Determine years to fetch
    const yearsToFetch = new Set<number>()
    if (startDateStr && endDateStr) {
      const sY = new Date(startDateStr).getFullYear()
      const eY = new Date(endDateStr).getFullYear()
      for (let y = sY; y <= eY; y++) yearsToFetch.add(y)
    } else {
      const currentYear = new Date().getFullYear()
      yearsToFetch.add(currentYear - 1)
      yearsToFetch.add(currentYear)
      yearsToFetch.add(currentYear + 1)
    }

    const holidayEvents: any[] = []
    const baseHolidays: any[] = []

    for (const year of yearsToFetch) {
      // 1. Fixed Holidays
      for (const h of holidays) {
        const [m, d] = h.date.split('-').map(Number)
        const date = new Date(year, m - 1, d)
        const start = new Date(year, m - 1, d, 0, 0, 0)
        const end = new Date(year, m - 1, d, 23, 59, 59)

        baseHolidays.push({
          id: `holiday-${year}-${h.date}`,
          title: h.title,
          description: '공휴일',
          location: null,
          lat: null,
          lng: null,
          locationAddress: null,
          placeId: null,
          startTime: start,
          endTime: end,
          type: 'holiday',
          calendarId: 'system-holidays',
          recurrenceRule: null,
          exdates: null,
          isSystemEvent: true,
          isRedDay: h.isRedDay,
          originalDate: date // Helper for substitute check
        })
      }

      // 2. Lunar Holidays
      // @ts-ignore
      const lunarList = getLunarHolidays(year)
      for (const h of lunarList) {
        const [y, m, d] = h.date.split('-').map(Number)
        const start = new Date(y, m - 1, d, 0, 0, 0)
        const end = new Date(y, m - 1, d, 23, 59, 59)
        const date = new Date(y, m - 1, d)

        baseHolidays.push({
          id: `lunar-${h.date}-${h.title}`,
          title: h.title,
          description: '명절',
          location: null,
          lat: null,
          lng: null,
          locationAddress: null,
          placeId: null,
          startTime: start,
          endTime: end,
          type: 'holiday',
          calendarId: 'system-holidays',
          recurrenceRule: null,
          exdates: null,
          isSystemEvent: true,
          isRedDay: h.isRedDay,
          originalDate: date
        })
      }
    }

    // 3. Process Substitute Holidays
    const finalHolidays = [...baseHolidays]

    // We iterate through all base holidays to check for substitutes
    for (const h of baseHolidays) {
      if (!h.isRedDay) continue
      if (h.title === '설날' || h.title === '추석') continue // Exception as requested

      const date = h.originalDate
      const dayOfWeek = date.getDay() // 0=Sun, 6=Sat

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        const substituteDate = new Date(date)
        // If Sun (0), add 1 day. If Sat (6), add 2 days.
        const daysToAdd = dayOfWeek === 0 ? 1 : 2
        substituteDate.setDate(date.getDate() + daysToAdd)

        const subStart = new Date(substituteDate.getFullYear(), substituteDate.getMonth(), substituteDate.getDate(), 0, 0, 0)
        const subEnd = new Date(substituteDate.getFullYear(), substituteDate.getMonth(), substituteDate.getDate(), 23, 59, 59)

        // Check if a holiday already exists on this substitute date?
        // Real logic requires checking collisions, but for now we trust the "Next Monday" rule.

        finalHolidays.push({
          id: `${h.id}-sub`,
          title: `대체공휴일 (${h.title})`,
          description: '대체공휴일',
          location: null,
          lat: null,
          lng: null,
          locationAddress: null,
          placeId: null,
          startTime: subStart,
          endTime: subEnd,
          type: 'holiday',
          calendarId: 'system-holidays',
          recurrenceRule: null,
          exdates: null,
          isSystemEvent: true,
          isRedDay: true
        })
      }
    }

    // Add holidays to the list if they fall within range logic (or just always send them as they are recurring)
    // Recurring events are expanded on frontend, so we just send the master events.

    return json([...filteredEvents, ...finalHolidays])
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
    logger.error('Events Create API Error:', { error: e })
    const status =
      e instanceof Error && 'status' in (e as any) ? (e as any).status : 500
    const message = e instanceof Error ? e.message : 'Internal Server Error'
    throw error(status, message)
  }
}
