
import { error, json } from '@sveltejs/kit'
import { db } from '$lib/server/db'
import {
  user,
  account,
  session,
  calendar,
  calendarMember,
  event,
  note,
  eventShare,
  chatLog
} from '$lib/server/db/schema'
import { eq, or, and } from 'drizzle-orm'
import type { RequestHandler } from './$types'

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const sessionUser = await locals.auth()
  const currentUserId = sessionUser?.user?.id
  const targetUserId = params.id

  if (!currentUserId || currentUserId !== targetUserId) {
    return error(403, 'Unauthorized')
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Preserve Chat Logs (Update userId to NULL)
      await tx
        .update(chatLog)
        .set({ userId: null })
        .where(eq(chatLog.userId, targetUserId))

      // 2. Delete Event Shares (where user is inviter or invitee)
      // Note: eventShare does not have foreign keys to user, so we must delete manually.
      await tx
        .delete(eventShare)
        .where(
          or(
            eq(eventShare.inviterId, targetUserId),
            eq(eventShare.inviteeId, targetUserId) // Ideally we check if inviteeId matches stored ID logic
          )
        )

      // 3. Delete Calendar Memberships
      await tx
        .delete(calendarMember)
        .where(eq(calendarMember.userId, targetUserId))

      // 4. Delete Calendars (Owned by user) -> Cascades to Events
      // Using manual delete as requested for explicit order, though cascade would handle it.
      await tx.delete(calendar).where(eq(calendar.userId, targetUserId))

      // 5. Delete Notes
      await tx.delete(note).where(eq(note.userId, targetUserId))

      // 6. Delete Sessions
      await tx.delete(session).where(eq(session.userId, targetUserId))

      // 7. Delete Accounts
      await tx.delete(account).where(eq(account.userId, targetUserId))

      // 8. Finally, Delete User
      await tx.delete(user).where(eq(user.id, targetUserId))
    })

    return json({ success: true })
  } catch (e) {
    console.error('Failed to delete user:', e)
    return error(500, 'Failed to delete user account')
  }
}
