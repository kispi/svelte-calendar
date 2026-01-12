import { db } from '$lib/server/db'
import { event } from '$lib/server/db/schema'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { createEvents } from 'ics'
import dayjs from 'dayjs'

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
            const start = dayjs(e.startTime)
            const end = dayjs(e.endTime)

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
                uid: e.id,
                created: [
                    dayjs(e.createdAt).year(),
                    dayjs(e.createdAt).month() + 1,
                    dayjs(e.createdAt).date(),
                    dayjs(e.createdAt).hour(),
                    dayjs(e.createdAt).minute()
                ],
                lastModified: [
                    dayjs(e.updatedAt).year(),
                    dayjs(e.updatedAt).month() + 1,
                    dayjs(e.updatedAt).date(),
                    dayjs(e.updatedAt).hour(),
                    dayjs(e.updatedAt).minute()
                ]
            }
        }))

        if (icsEvents.length === 0) {
            // Return empty ICS if no events
            return new Response('BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Justodo//Calendar//EN\nEND:VCALENDAR', {
                headers: {
                    'Content-Type': 'text/calendar',
                    'Content-Disposition': 'attachment; filename="calendar.ics"'
                }
            })
        }

        const { error: icsError, value } = createEvents(icsEvents)

        if (icsError) {
            console.error('ICS Generation Error:', icsError)
            throw error(500, 'Failed to generate calendar file')
        }

        return new Response(value, {
            headers: {
                'Content-Type': 'text/calendar',
                'Content-Disposition': 'attachment; filename="calendar.ics"'
            }
        })
    } catch (e) {
        console.error('Export Error:', e)
        throw error(500, 'Internal Server Error')
    }
}
