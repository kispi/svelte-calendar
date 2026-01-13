import { db } from '$lib/server/db'
import { event } from '$lib/server/db/schema'
import { error, json } from '@sveltejs/kit'
import { eq, and } from 'drizzle-orm'

import type { RequestHandler } from './$types'

export const PUT: RequestHandler = async ({ params, request, locals }) => {
    const session = await locals.auth()
    if (!session?.user?.id) throw error(401, 'Unauthorized')

    try {
        const body = await request.json()

        // Extract fields to update
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
            endTime
        } = body

        if (!title) throw error(400, 'Title is required')

        await db
            .update(event)
            .set({
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
                updatedAt: new Date()
            })
            .where(and(eq(event.id, params.id), eq(event.userId, session.user.id)))

        const [updated] = await db
            .select()
            .from(event)
            .where(and(eq(event.id, params.id), eq(event.userId, session.user.id)))

        if (!updated) throw error(404, 'Event not found')
        return json(updated)
    } catch (e) {
        console.error('Events Update API Error:', e)
        const status = e instanceof Error && 'status' in (e as any) ? (e as any).status : 500
        const message = e instanceof Error ? e.message : 'Internal Server Error'
        throw error(status, message)
    }
}

export const DELETE: RequestHandler = async ({ params, locals }) => {
    const session = await locals.auth()
    if (!session?.user?.id) throw error(401, 'Unauthorized')

    try {
        await db
            .delete(event)
            .where(and(eq(event.id, params.id), eq(event.userId, session.user.id)))

        return json({ success: true })
    } catch (e) {
        console.error('Events Delete API Error:', e)
        const status = e instanceof Error && 'status' in (e as any) ? (e as any).status : 500
        const message = e instanceof Error ? e.message : 'Internal Server Error'
        throw error(status, message)
    }
}
