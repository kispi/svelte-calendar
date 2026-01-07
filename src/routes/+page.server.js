import { db } from '$lib/server/db';
import { events } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import { eq, and, gte, lte } from 'drizzle-orm';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
    const session = await locals.auth();
    return { session };
}

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

// Helper to ensure ISO format (or null)
/** @param {FormDataEntryValue | null} d */
const toISO = (d) => d ? dayjs(d.toString()).toISOString() : null;

/** @type {import('./$types').Actions} */
export const actions = {
    create: async ({ request, locals }) => {
        const session = await locals.auth();

        if (!session?.user?.id) return fail(401, { message: 'Unauthorized' });

        const data = await request.formData();
        const title = data.get('title');
        const description = data.get('description');
        const type = data.get('type') || 'schedule';
        const startTime = data.get('startTime');
        const endTime = data.get('endTime');



        if (!title) {
            return fail(400, { missing: true });
        }

        try {
            await db.insert(events).values({
                title: title.toString(),
                description: description ? description.toString() : null,
                type: type.toString(),
                startTime: toISO(startTime),
                endTime: toISO(endTime),
                userId: session.user.id
            });
            return { success: true };
        } catch (error) {
            console.error(error);
            return fail(500, { message: 'Failed to create event' });
        }
    },

    delete: async ({ request, locals }) => {
        const session = await locals.auth();
        if (!session?.user?.id) return fail(401, { message: 'Unauthorized' });

        const data = await request.formData();
        const id = data.get('id');

        if (!id) {
            return fail(400, { missing: true });
        }

        try {
            await db.delete(events).where(and(
                eq(events.id, parseInt(id.toString())),
                eq(events.userId, session.user.id)
            ));
            return { success: true };
        } catch (error) {
            console.error(error);
            return fail(500, { message: 'Failed to delete event' });
        }
    },

    update: async ({ request, locals }) => {
        const session = await locals.auth();
        if (!session?.user?.id) return fail(401, { message: 'Unauthorized' });

        const data = await request.formData();
        const id = data.get('id');
        const title = data.get('title');
        const description = data.get('description');
        const type = data.get('type') || 'schedule';
        const startTime = data.get('startTime');
        const endTime = data.get('endTime');

        if (!id || !title) {
            return fail(400, { missing: true });
        }

        try {
            await db.update(events)
                .set({
                    title: title.toString(),
                    description: description ? description.toString() : null,
                    type: type.toString(),
                    startTime: toISO(startTime),
                    endTime: toISO(endTime),
                })
                .where(and(
                    eq(events.id, parseInt(id.toString())),
                    eq(events.userId, session.user.id)
                ));
            return { success: true };
        } catch (error) {
            console.error(error);
            return fail(500, { message: 'Failed to update event' });
        }
    }
};
