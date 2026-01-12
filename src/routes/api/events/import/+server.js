import { db } from '$lib/server/db'
import { event } from '$lib/server/db/schema'
import { error, json } from '@sveltejs/kit'
import ical from 'node-ical'
import dayjs from 'dayjs'

/** @type {import('./$types').RequestHandler} */
export async function POST({ locals, request }) {
    const session = await locals.auth()
    if (!session?.user?.id) {
        throw error(401, 'Unauthorized')
    }

    try {
        const formData = await request.formData()
        const file = formData.get('file')

        if (!file || !(file instanceof File)) {
            throw error(400, 'No file uploaded')
        }

        const content = await file.text()
        const data = await ical.async.parseICS(content)

        const eventsToInsert = []

        for (const k in data) {
            const item = data[k]
            if (item.type === 'VEVENT') {
                eventsToInsert.push({
                    id: item.uid || crypto.randomUUID(),
                    title: item.summary || 'Untitled Event',
                    description: item.description || '',
                    location: item.location || '',
                    startTime: dayjs(item.start).toISOString(),
                    endTime: dayjs(item.end).toISOString(),
                    userId: session.user.id,
                    type: 'schedule'
                })
            }
        }

        if (eventsToInsert.length === 0) {
            return json({ success: true, count: 0, message: 'No events found in file' })
        }

        // Perform upserts
        // Using simple loop for SQLite compatibility and clarity
        for (const e of eventsToInsert) {
            await db.insert(event)
                .values(e)
                .onConflictDoUpdate({
                    target: event.id,
                    set: {
                        title: e.title,
                        description: e.description,
                        location: e.location,
                        startTime: e.startTime,
                        endTime: e.endTime,
                        updatedAt: new Date().toISOString()
                    }
                })
        }

        return json({
            success: true,
            count: eventsToInsert.length,
            message: `Successfully imported ${eventsToInsert.length} events`
        })

    } catch (e) {
        console.error('Import Error:', e)
        const message = e instanceof Error ? e.message : 'Unknown error'
        throw error(500, 'Internal Server Error: ' + message)
    }
}
