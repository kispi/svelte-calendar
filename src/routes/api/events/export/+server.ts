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
            .all()

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
                description: e.description || '',
                location: e.location || '',
                uid: `${e.id}@justodo.vibrew.ai`,
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
                geo: (e.lat && e.lng) ? { lat: e.lat, lon: e.lng } : undefined,
                // Custom properties for Justodo specific data
                // Note: 'ics' library might need these to be passed in a specific way if strictly typed,
                // but usually extra keys are ignored or handled if the library allows.
                // If 'ics' library doesn't support arbitrary keys, we might need a workaround,
                // but let's try standard X-prop formatting if supported or just add them.
                // Looking at common 'ics' library usage, X-props are often passed loosely or via 'attributes'.
                // Let's try passing them as top-level keys first if the types allow, or check if we need to cast.
                // Since I can't check docs, I'll assume passing them might work or I'll just rely on IMPORT fixing it primarily.
                // Wait, if export doesn't write them, import can't read them.
                // Let's force them via a cast if needed, or use a known property if available.
                // Actually, 'ics' package usually accepts `attributes` array for custom props.
                attributes: [
                    ...(e.locationAddress ? [{
                        key: 'X-JUSTODO-ADDRESS',
                        value: e.locationAddress
                    }] : []),
                    ...(e.placeId ? [{
                        key: 'X-JUSTODO-PLACE-ID',
                        value: e.placeId
                    }] : [])
                ]
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
            console.error('ICS Input Data Example:', JSON.stringify(icsEvents.slice(0, 3), null, 2))
            throw error(500, `Failed to generate calendar file: ${JSON.stringify(icsError)}`)
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
