import { db } from '$lib/server/db'
import { event } from '$lib/server/db/schema'
import { fail } from '@sveltejs/kit'
import { eq, and } from 'drizzle-orm'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth()
  return { session }
}

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

// Helper to ensure Date object (or null)
const toDate = (d: FormDataEntryValue | null) => (d ? dayjs(d.toString()).toDate() : null)

export const actions: Actions = {
}
