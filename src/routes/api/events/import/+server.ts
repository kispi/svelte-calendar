import { db } from '$lib/server/db'
import { event, calendar } from '$lib/server/db/schema'
import { logger } from '$lib/logger'
import { error, json } from '@sveltejs/kit'
import { eq, asc } from 'drizzle-orm'
import ical from 'node-ical'
import dayjs from 'dayjs'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ locals, request }) => {
  const session = await locals.auth()
  if (!session?.user?.id) {
    throw error(401, 'Unauthorized')
  }

  try {
    const contentType = request.headers.get('content-type') || ''

    // 1. Handle JSON body: Insert selected events
    if (contentType.includes('application/json')) {
      const { events } = await request.json()
      if (!events || !Array.isArray(events)) {
        throw error(400, 'Invalid events data')
      }

      if (events.length === 0) {
        return json({ success: true, count: 0, message: 'No events to import' })
      }

      // Fetch user's primary calendar
      const userCalendars = await db
        .select()
        .from(calendar)
        .where(eq(calendar.userId, session.user.id))
        .orderBy(asc(calendar.createdAt))

      let targetCalendarId = userCalendars.find((c) => c.isPrimary)?.id
      if (!targetCalendarId && userCalendars.length > 0) {
        targetCalendarId = userCalendars[0].id
      }

      // If no calendar exists, create a default one
      if (!targetCalendarId) {
        const newCalId = crypto.randomUUID()
        await db.insert(calendar).values({
          id: newCalId,
          userId: session.user.id,
          name: 'My Calendar',
          color: '#3b82f6',
          isPrimary: 1
        })
        targetCalendarId = newCalId
      }

      // Perform upserts
      for (const e of events) {
        // userId removed
        e.calendarId = targetCalendarId // Assign to valid calendar

        // Convert date strings to Date objects for MySQL datetime/timestamp columns
        const values = {
          ...e,
          startTime: e.startTime ? new Date(e.startTime) : null,
          endTime: e.endTime ? new Date(e.endTime) : null,
          createdAt: e.createdAt ? new Date(e.createdAt) : undefined,
          updatedAt: e.updatedAt ? new Date(e.updatedAt) : undefined,
          deletedAt: e.deletedAt ? new Date(e.deletedAt) : undefined,
          // Ensure recurrenceRule is preserved
          recurrenceRule: e.recurrenceRule || null
        }

        await db
          .insert(event)
          .values(values)
          .onDuplicateKeyUpdate({
            set: {
              title: values.title,
              description: values.description,
              location: values.location,
              locationAddress: values.locationAddress,
              placeId: values.placeId,
              lat: values.lat,
              lng: values.lng,
              startTime: values.startTime,
              endTime: values.endTime,
              updatedAt: new Date(),
              calendarId: values.calendarId, // Update calendarId if exists
              recurrenceRule: values.recurrenceRule
            }
          })
      } // End for loop

      return json({
        success: true,
        count: events.length,
        message: `Successfully imported ${events.length} events`
      })
    }

    // 2. Handle File Upload: Parse and Preview
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      throw error(400, 'No file uploaded')
    }

    const content = await file.text()
    const data = await ical.async.parseICS(content)

    const parsedEvents: any[] = []

    for (const k in data) {
      const item = data[k] as any
      if (item.type === 'VEVENT') {
        parsedEvents.push({
          id: (() => {
            const uid = item.uid || crypto.randomUUID()
            return uid.includes('@') ? uid : `${uid}@gravex.app`
          })(),
          // @ts-ignore
          title: item.summary || 'Untitled Event',
          description:
            (item.description || '').split('\n\n--- GRAVEX CALENDAR METADATA ---')[0] ||
            '',
          location: item.location || '',
          locationAddress: (() => {
            const match = (item.description || '').match(/ADDRESS:(.+)/)
            return match ? match[1].trim() : ''
          })(),
          placeId: (() => {
            const match = (item.description || '').match(/PLACE_ID:(.+)/)
            return match ? match[1].trim() : ''
          })(),
          // @ts-ignore
          lat: item.geo ? parseFloat(item.geo.lat) : null,
          // @ts-ignore
          lng: item.geo ? parseFloat(item.geo.lon) : null,
          startTime: dayjs(item.start).toISOString(),
          endTime: dayjs(item.end).toISOString(),
          // userId removed
          // Extract RRule
          recurrenceRule: item.rrule ? item.rrule.toString() : null,
          type: 'schedule'
        })
      }
    }

    return json({
      success: true,
      preview: true,
      events: parsedEvents,
      message: `Found ${parsedEvents.length} events`
    })
  } catch (e) {
    logger.error('Import Error:', { error: e })
    const message = e instanceof Error ? e.message : 'Unknown error'
    throw error(500, 'Internal Server Error: ' + message)
  }
}
