import type { RequestHandler } from './$types'
import { db } from '$lib/server/db'
import { event } from '$lib/server/db/schema'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { createEvents, type EventAttributes } from 'ics'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

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

    const icsEvents: EventAttributes[] = allEvents.map((e) => {
      let start = dayjs(e.startTime)
      let end = dayjs(e.endTime)
      const created = dayjs(e.createdAt)
      const updated = dayjs(e.updatedAt)

      // Fallback for missing/invalid start time: start of today
      if (!start.isValid()) {
        start = dayjs().startOf('day')
      }

      // Fallback for missing/invalid end time
      if (!end.isValid()) {
        // If the original start time was also invalid, make it a full day event (end of today)
        if (!dayjs(e.startTime).isValid()) {
          end = dayjs().endOf('day')
        } else {
          // Otherwise default to 1 hour after start
          end = start.add(1, 'hour')
        }
      }

      // Ensure end time is not before/same as start time
      if (end.isBefore(start) || end.isSame(start)) {
        end = start.add(1, 'hour')
      }

      return {
        start: [
          start.year(),
          start.month() + 1,
          start.date(),
          start.hour(),
          start.minute()
        ],
        end: [
          end.year(),
          end.month() + 1,
          end.date(),
          end.hour(),
          end.minute()
        ],
        title: e.title || '(No Title)',
        location: e.location || '',
        uid: e.id.includes('@') ? e.id : `${e.id}@justodo.vibrew.ai`,
        created: [
          created.isValid() ? created.year() : start.year(),
          created.isValid() ? created.month() + 1 : start.month() + 1,
          created.isValid() ? created.date() : start.date(),
          created.isValid() ? created.hour() : start.hour(),
          created.isValid() ? created.minute() : start.minute()
        ],
        lastModified: [
          updated.isValid() ? updated.year() : start.year(),
          updated.isValid() ? updated.month() + 1 : start.month() + 1,
          updated.isValid() ? updated.date() : start.date(),
          updated.isValid() ? updated.hour() : start.hour(),
          updated.isValid() ? updated.minute() : start.minute()
        ],
        status: 'CONFIRMED',
        categories: [e.type || 'schedule'],
        // Standard iCal GEO property
        geo: e.lat && e.lng ? { lat: e.lat, lon: e.lng } : undefined,
        description: [
          e.description || '',
          e.locationAddress || e.placeId ? '\n\n--- JUSTODO METADATA ---' : '',
          e.locationAddress ? `ADDRESS:${e.locationAddress}` : '',
          e.placeId ? `PLACE_ID:${e.placeId}` : ''
        ]
          .filter(Boolean)
          .join('\n')
      }
    })

    if (icsEvents.length === 0) {
      // Return empty ICS if no events, using CRLF and standard headers
      const emptyIcs = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'PRODID:-//Justodo//Calendar//EN',
        'END:VCALENDAR'
      ].join('\r\n')

      return new Response(emptyIcs, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'attachment; filename="calendar.ics"'
        }
      })
    }

    const { error: icsError, value } = createEvents(icsEvents, {
      productId: '-//Justodo//Calendar//EN',
      calName: 'Justodo Calendar'
    })

    if (icsError) {
      console.error('ICS Generation Error Object:', icsError)
      console.error(
        'ICS Input Data Example:',
        JSON.stringify(icsEvents.slice(0, 3), null, 2)
      )
      throw error(
        500,
        `Failed to generate calendar file: ${JSON.stringify(icsError)}`
      )
    }

    return new Response(value, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="calendar.ics"',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (e) {
    console.error('Export Error:', e)
    throw error(500, 'Internal Server Error')
  }
}
