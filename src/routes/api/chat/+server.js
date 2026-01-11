import { json, error } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { db } from '$lib/server/db'
import { event as eventTable } from '$lib/server/db/schema'
import { eq, and, gte, lte, asc } from 'drizzle-orm'
import dayjs from 'dayjs'

if (!env.GOOGLE_AI_API_KEY) {
    console.error('[AI Chat] GOOGLE_AI_API_KEY is missing in environment variables!');
}
const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY || '')

export const POST = async ({ request, locals }) => {
    const session = await locals.auth()
    if (!session?.user?.id) {
        throw error(401, 'Unauthorized')
    }

    const userId = session.user.id
    const { messages } = await request.json()

    // Define tools for Gemini
    const tools = [
        {
            functionDeclarations: [
                {
                    name: 'get_events',
                    description: 'Fetch events for the current user within a specific time range.',
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            startDate: {
                                type: SchemaType.STRING,
                                description: 'ISO 8601 date string (YYYY-MM-DD)'
                            },
                            endDate: {
                                type: SchemaType.STRING,
                                description: 'ISO 8601 date string (YYYY-MM-DD)'
                            }
                        },
                        required: ['startDate', 'endDate']
                    }
                },
                {
                    name: 'move_to_date',
                    description: 'Signal the calendar UI to move to a specific date or month.',
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            date: {
                                type: SchemaType.STRING,
                                description: 'ISO 8601 date string (YYYY-MM-DD) or just YYYY-MM'
                            }
                        },
                        required: ['date']
                    }
                }
            ]
        }
    ]

    const model = genAI.getGenerativeModel({
        model: 'gemini-3-flash-preview',
        tools
    })

    // Convert message history to Google's format
    // Gemini's history must start with a 'user' role message.
    /** @type {import('@google/generative-ai').Content[]} */
    const history = messages
        .slice(0, -1)
        .map((/** @type {any} */ m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }))
        .filter((/** @type {any} */ msg, /** @type {number} */ index) => {
            // Skip leading 'model' messages to satisfy Gemini's startChat requirements
            if (index === 0 && msg.role === 'model') return false;
            return true;
        })

    const chat = model.startChat({
        history,
        systemInstruction: {
            parts: [{
                text: `You are Justodo Assistant, a helpful AI built into the Justodo Planner. 
      You help users manage their calendar and notes.
      Today is ${dayjs().format('YYYY-MM-DD dddd')}.
      - Use get_events to check the user's schedule. 
      - Use move_to_date when a user asks to see a specific date, month, or year.
      - ALWAYS restrict data access to the current user (you don't need to ask for user ID, it's handled on the server).
      - Be concise and professional.
      - NEVER allow creating, editing, or deleting events. Strictly READ-ONLY for data.` }]
        }
    })

    const lastMessage = messages[messages.length - 1].content
    console.log('[AI Chat] User Message:', lastMessage)
    const result = await chat.sendMessage(lastMessage)
    let response = result.response

    // Handle function calls
    const candidate = response.candidates?.[0]
    const part = candidate?.content?.parts?.find((p) => p.functionCall)
    const call = part?.functionCall

    if (call) {
        const { name, args } = call
        console.log(`[AI Chat] Tool Call: ${name}`, args)

        if (name === 'get_events') {
            const { startDate, endDate } = /** @type {any} */ (args)
            const events = await db
                .select()
                .from(eventTable)
                .where(
                    and(
                        eq(eventTable.userId, userId),
                        gte(eventTable.startTime, dayjs(startDate).startOf('day').toISOString()),
                        lte(eventTable.startTime, dayjs(endDate).endOf('day').toISOString())
                    )
                )
                .orderBy(asc(eventTable.startTime))

            console.log(`[AI Chat] Found ${events.length} events in range ${startDate} to ${endDate}`)

            const toolResponse = await chat.sendMessage([
                {
                    functionResponse: {
                        name: 'get_events',
                        response: { events }
                    }
                }
            ])
            response = toolResponse.response
        } else if (name === 'move_to_date') {
            // Just confirm and return the signal
            const { date } = /** @type {any} */ (args)
            return json({
                content: `Moving calendar to ${date}...`,
                moveToDate: date
            })
        }
    }

    return json({
        content: response.text()
    })
}
