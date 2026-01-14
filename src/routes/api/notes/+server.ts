import { db } from '$lib/server/db'
import { note } from '$lib/server/db/schema'
import { json, error } from '@sveltejs/kit'
import { eq, desc } from 'drizzle-orm'

import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals }) => {
  const session = await locals.auth()
  if (!session?.user?.id) throw error(401, 'Unauthorized')

  try {
    const allNotes = await db
      .select()
      .from(note)
      .where(eq(note.userId, session.user.id))
      .orderBy(desc(note.updatedAt))
    return json(allNotes)
  } catch (e) {
    console.error('Notes API Error:', e)
    throw error(500, 'Internal Server Error')
  }
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = await locals.auth()
  if (!session?.user?.id) throw error(401, 'Unauthorized')

  try {
    const { title, content } = await request.json()
    const id = crypto.randomUUID()
    await db.insert(note).values({
      id,
      title,
      content,
      userId: session.user.id
    })

    const [inserted] = await db.select().from(note).where(eq(note.id, id))

    return json(inserted)
  } catch (e) {
    console.error('Notes API Error:', e)
    throw error(500, 'Internal Server Error')
  }
}
