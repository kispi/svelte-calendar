import { SvelteKitAuth } from '@auth/sveltekit'
import Kakao from '@auth/sveltekit/providers/kakao'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '$lib/server/db'
import { env } from '$env/dynamic/private'

import {
  user,
  account,
  session,
  verificationToken
} from '$lib/server/db/schema'

const drizzleAdapter = DrizzleAdapter(db, {
  usersTable: user,
  accountsTable: account,
  sessionsTable: session,
  verificationTokensTable: verificationToken
})

export const { handle } = SvelteKitAuth({
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
  trustHost: true
})
