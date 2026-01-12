import { db } from '$lib/server/db'
import { event } from '$lib/server/db/schema'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { createEvents } from 'ics'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
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

        const icsEvents = /** @type {any[]} */ (allEvents.map((e) => {
            // Use local time for preparation because the 'ics' library 
            // converts its input to UTC based on the server's local timezone.
            // If we use .utc() here, it causes a double-shift.
            const start = dayjs(e.startTime)
            const end = dayjs(e.endTime)
            const created = dayjs(e.createdAt)
            const updated = dayjs(e.updatedAt)

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
                title: e.title,
                description: e.description || '',
                location: e.location || '',
                uid: `${e.id}@justodo.vibrew.ai`,
                created: [
                    created.year(),
                    created.month() + 1,
                    created.date(),
                    created.hour(),
                    created.minute()
                ],
                lastModified: [
                    updated.year(),
                    updated.month() + 1,
                    updated.date(),
                    updated.hour(),
                    updated.minute()
                ],
                status: 'CONFIRMED',
                categories: [e.type || 'schedule']
            }
        }))

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
            console.error('ICS Generation Error:', icsError)
            throw error(500, 'Failed to generate calendar file')
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
