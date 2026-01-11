import { db } from '$lib/server/db'
import { note } from '$lib/server/db/schema'
import { error, json } from '@sveltejs/kit'
import { eq, and } from 'drizzle-orm'

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params, locals }) {
    const session = await locals.auth()
    if (!session?.user?.id) throw error(401, 'Unauthorized')

    try {
        const result = await db
            .delete(note)
            .where(and(eq(note.id, params.id), eq(note.userId, session.user.id)))
            .returning()

        if (result.length === 0) {
            throw error(404, 'Note not found')
        }

        return json({ success: true })
    } catch (e) {
        console.error('Notes Delete API Error:', e)
        throw error(500, 'Internal Server Error')
    }
}
