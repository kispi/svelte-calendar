import { SvelteKitAuth } from '@auth/sveltekit'
import Kakao from '@auth/sveltekit/providers/kakao'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '$lib/server/db'
import { env } from '$env/dynamic/private'

import {
  user,
  account,
  session,
  calendar,
  calendarMember
} from '$lib/server/db/schema'

const drizzleAdapter = DrizzleAdapter(db, {
  usersTable: user,
  accountsTable: account,
  // @ts-ignore
  sessionsTable: session
})

const { handle: authHandle } = SvelteKitAuth({
  adapter: drizzleAdapter,
  providers: [
    Kakao({
      clientId: env.KAKAO_CLIENT_ID,
      clientSecret: env.KAKAO_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true
    })
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    }
  },
  events: {
    async createUser(message) {
      const { user } = message
      if (!user.id) return

      try {
        const calendarId = crypto.randomUUID()
        await db.insert(calendar).values({
          id: calendarId,
          name: 'Personal',
          color: '#3b82f6',
          userId: user.id,
          isPrimary: 1
        })

        await db.insert(calendarMember).values({
          calendarId,
          userId: user.id,
          role: 'owner'
        })
        console.log(`Created default calendar for user ${user.id}`)
      } catch (e) {
        console.error('Failed to create default calendar', e)
      }
    }
  },
  trustHost: true
})

import { sequence } from '@sveltejs/kit/hooks'
import type { Handle } from '@sveltejs/kit'

export const handle = authHandle
