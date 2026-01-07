import { SvelteKitAuth } from '@auth/sveltekit'
import Kakao from '@auth/sveltekit/providers/kakao'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '$lib/server/db'
import { env } from '$env/dynamic/private'

import {
  users,
  accounts,
  sessions,
  verificationTokens
} from '$lib/server/db/schema'

// @ts-ignore
const drizzleAdapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens
})

/** @type {import("@auth/sveltekit").SvelteKitAuthConfig["adapter"]} */
const customAdapter = {
  ...drizzleAdapter,
  async createSession(session) {
    const result = await drizzleAdapter.createSession({
      ...session,
      expires: session.expires.toISOString()
    })
    if (result) {
      result.expires = new Date(result.expires)
    }
    return result
  },
  async updateSession(session) {
    const result = await drizzleAdapter.updateSession({
      ...session,
      expires: session.expires?.toISOString()
    })
    if (result?.expires) {
      result.expires = new Date(result.expires)
    }
    return result
  },
  async createVerificationToken(token) {
    const result = await drizzleAdapter.createVerificationToken({
      ...token,
      expires: token.expires.toISOString()
    })
    if (result?.expires) {
      result.expires = new Date(result.expires)
    }
    return result
  },
  // We also need to ensure read operations convert String -> Date back for Auth.js
  // Auth.js expects `expires` to be a Date object.
  async getSessionAndUser(sessionToken) {
    const result = await drizzleAdapter.getSessionAndUser(sessionToken)
    if (result?.session) {
      result.session.expires = new Date(result.session.expires)
    }
    return result
  }
}

export const { handle } = SvelteKitAuth({
  adapter: customAdapter,
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
