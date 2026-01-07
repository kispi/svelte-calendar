import { db } from '$lib/server/db';
import { events } from '$lib/server/db/schema';
import { json, error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
    const session = await locals.auth();
    if (!session?.user?.id) {
        throw error(401, 'Unauthorized');
    }

    try {
        const allEvents = await db.select().from(events).where(eq(events.userId, session.user.id)).all();
        return json(allEvents);
    } catch (e) {
        console.error('API Error:', e);
        throw error(500, 'Internal Server Error');
    }
}
