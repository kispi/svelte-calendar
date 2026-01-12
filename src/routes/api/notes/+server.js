import { db } from '$lib/server/db'
import { note } from '$lib/server/db/schema'
import { json, error } from '@sveltejs/kit'
import { eq, desc } from 'drizzle-orm'

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
    const session = await locals.auth()
    if (!session?.user?.id) throw error(401, 'Unauthorized')

    try {
        const allNotes = await db
            .select()
            .from(note)
            .where(eq(note.userId, session.user.id))
            .orderBy(desc(note.updatedAt))
            .all()
        return json(allNotes)
    } catch (e) {
        console.error('Notes API Error:', e)
        throw error(500, 'Internal Server Error')
    }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
    const session = await locals.auth()
    if (!session?.user?.id) throw error(401, 'Unauthorized')

    try {
        const { title, content } = await request.json()
        const [inserted] = await db
            .insert(note)
            .values({
                title,
                content,
                userId: session.user.id
            })
            .returning()
        return json(inserted)
    } catch (e) {
        console.error('Notes API Error:', e)
        throw error(500, 'Internal Server Error')
    }
}


