import { db } from '$lib/server/db'
import { note } from '$lib/server/db/schema'
import { error, json } from '@sveltejs/kit'
import { eq, and } from 'drizzle-orm'

import type { RequestHandler } from './$types'

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const session = await locals.auth()
  if (!session?.user?.id) throw error(401, 'Unauthorized')

  try {
    const [result] = await db
      .delete(note)
      .where(and(eq(note.id, params.id), eq(note.userId, session.user.id)))

    if (result.affectedRows === 0) {
      throw error(404, 'Note not found')
    }

    return json({ success: true })
  } catch (e) {
    console.error('Notes Delete API Error:', e)
    throw error(500, 'Internal Server Error')
  }
}

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const session = await locals.auth()
  if (!session?.user?.id) throw error(401, 'Unauthorized')

  try {
    const { title, content } = await request.json()
    await db
      .update(note)
      .set({
        title,
        content,
        updatedAt: new Date()
      })
      .where(and(eq(note.id, params.id), eq(note.userId, session.user.id)))

    const [updated] = await db
      .select()
      .from(note)
      .where(and(eq(note.id, params.id), eq(note.userId, session.user.id)))

    if (!updated) throw error(404, 'Note not found')
    return json(updated)
  } catch (e) {
    console.error('Notes Update API Error:', e)
    const status =
      e instanceof Error && 'status' in e ? /** @type {any} */ e.status : 500
    const message = e instanceof Error ? e.message : 'Internal Server Error'
    throw error(status as number, message)
  }
}
