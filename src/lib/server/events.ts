import { db } from '$lib/server/db'
import { event, calendar, calendarMember } from '$lib/server/db/schema'
import { eq, and } from 'drizzle-orm'
import { error } from '@sveltejs/kit'

export interface CreateEventParams {
  title: string
  startTime: Date | null
  endTime: Date | null
  location?: string
  description?: string
  locationAddress?: string
  placeId?: string
  lat?: number
  lng?: number
  type?: string
  recurrenceRule?: string
  calendarId?: string
}

/**
 * Creates an event for the user.
 * Automatically resolves the target calendar if not provided.
 */
export const createEvent = async (userId: string, params: CreateEventParams) => {
  let targetCalendarId = params.calendarId

  // 1. Resolve Calendar ID if not provided
  if (!targetCalendarId) {
    const primary = await db.query.calendar.findFirst({
      where: and(
        eq(calendar.userId, userId),
        eq(calendar.isPrimary, 1)
      )
    })

    if (primary) {
      targetCalendarId = primary.id
    } else {
      // Fallback: any calendar they own
      const member = await db.query.calendarMember.findFirst({
        where: and(
          eq(calendarMember.userId, userId),
          eq(calendarMember.role, 'owner')
        )
      })
      if (member) targetCalendarId = member.calendarId
    }
  }

  if (!targetCalendarId) {
    throw error(400, 'No calendar found for this user')
  }

  // 2. Permission Check (Even if auto-resolved, good to verify ownership/write access)
  const membership = await db.query.calendarMember.findFirst({
    where: and(
      eq(calendarMember.calendarId, targetCalendarId),
      eq(calendarMember.userId, userId)
    )
  })

  // Start with a strict check: must NOT be reader.
  // In the future if we allow sharing, we might check specifically for 'writer' or 'owner'.
  // Default role is 'owner' for new calendars.
  if (!membership || membership.role === 'reader') {
    throw error(403, 'You do not have permission to add events to this calendar')
  }

  // 3. Insert Event
  const id = crypto.randomUUID()
  const now = new Date()

  await db.insert(event).values({
    id,
    title: params.title,
    description: params.description,
    location: params.location,
    locationAddress: params.locationAddress,
    placeId: params.placeId,
    lat: params.lat,
    lng: params.lng,
    type: params.type || 'schedule',
    startTime: params.startTime,
    endTime: params.endTime,
    recurrenceRule: params.recurrenceRule || null,
    calendarId: targetCalendarId,
    createdAt: now,
    updatedAt: now
  })

  // 4. Return created event
  const [newEvent] = await db.select().from(event).where(eq(event.id, id))
  return newEvent
}
