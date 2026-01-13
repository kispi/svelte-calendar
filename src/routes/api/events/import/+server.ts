import { db } from '$lib/server/db'
import { event } from '$lib/server/db/schema'
import { error, json } from '@sveltejs/kit'
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

            // Perform upserts
            for (const e of events) {
                // Ensure userId is the current user
                e.userId = session.user.id
                await db.insert(event)
                    .values(e)
                    .onConflictDoUpdate({
                        target: event.id,
                        set: {
                            title: e.title,
                            description: e.description,
                            location: e.location,
                            locationAddress: e.locationAddress,
                            placeId: e.placeId,
                            lat: e.lat,
                            lng: e.lng,
                            startTime: e.startTime,
                            endTime: e.endTime,
                            updatedAt: new Date().toISOString()
                        }
                    })
            }

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
            const item = data[k]
            if (item.type === 'VEVENT') {
                parsedEvents.push({
                    id: item.uid || crypto.randomUUID(),
                    // @ts-ignore
                    title: item.summary || 'Untitled Event',
                    description: (item.description || '').split('\n\n--- JUSTODO METADATA ---')[0] || '',
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
                    userId: session.user.id,
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
        console.error('Import Error:', e)
        const message = e instanceof Error ? e.message : 'Unknown error'
        throw error(500, 'Internal Server Error: ' + message)
    }
}
