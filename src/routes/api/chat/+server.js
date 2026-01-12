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
    const { messages, clientDate } = await request.json()

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

    // Map history ensuring it adheres to Gemini's Content structure
    // We expect messages to follow { role, parts: [{ text: string } | { functionCall: ... } | { functionResponse: ... }] }
    /** @type {import('@google/generative-ai').Content[]} */
    const history = messages
        .slice(0, -1)
        .map((/** @type {any} */ m) => ({
            role: m.role,
            parts: m.parts
        }))
        .filter((/** @type {any} */ msg, /** @type {number} */ index) => {
            // Gemini history MUST start with 'user' role
            if (index === 0 && msg.role !== 'user') return false;
            return true;
        })

    const chat = model.startChat({
        history,
        systemInstruction: {
            parts: [{
                text: `You are Justodo Assistant, a helpful AI built into the Justodo Planner. 
      Today is ${dayjs(clientDate || undefined).format('YYYY-MM-DD dddd')}.
      
      # Capabilities
      - Use 'get_events' to search for past or future events.
      - Use 'move_to_date' when the user clearly wants to navigate the calendar view to a specific time.

      # Data Interpretation
      - The 'Event' model has Title, Location, Description, StartTime, EndTime, and Type.
      - **Money/Cost**: If a user asks about "price", "cost", "expense", or "congratulatory money", LOOK INSIDE the 'description' or 'title' fields. Assume numbers found there (e.g., "50000", "50k") represent the amount.
      - **Aggregation**: You can calculate totals (e.g. "Total congratulatory money this year") by fetching relevant events first, then extracting and summing up numbers from their descriptions.
      - **Filtering**: To find "most expensive" or "cheapest", retrieve the events, parse the costs from descriptions, and sort them yourself.

      # Rules
      - ALWAYS restrict data access to the current user.
      - Be concise and professional.
      - Never modify data (READ-ONLY).` }]
        }
    })

    const lastMessage = messages[messages.length - 1]
    // lastMessage should be { role: 'user', parts: [{ text: '...' }] }
    const result = await chat.sendMessage(lastMessage.parts)
    let response = result.response

    // Handle function calls in a loop (for complex multi-step queries)
    let callCount = 0
    while (response.candidates?.[0]?.content?.parts?.some(p => p.functionCall) && callCount < 5) {
        callCount++
        const parts = response.candidates[0].content.parts
        const toolResponses = []

        for (const part of parts) {
            if (part.functionCall) {
                const { name, args } = part.functionCall
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

                    toolResponses.push({
                        functionResponse: {
                            name: 'get_events',
                            response: { events }
                        }
                    })
                } else if (name === 'move_to_date') {
                    const { date } = /** @type {any} */ (args)
                    toolResponses.push({
                        functionResponse: {
                            name: 'move_to_date',
                            response: { success: true, movedTo: date }
                        }
                    })
                }
            }
        }

        if (toolResponses.length > 0) {
            const toolResult = await chat.sendMessage(toolResponses)
            response = toolResult.response
        }
    }

    // Capture the full updated history from the chat session
    const fullHistory = await chat.getHistory()

    // Check if move_to_date was called in the chain to signal the UI
    const allParts = fullHistory.flatMap(h => h.parts)
    const moveCall = allParts.find(p => p.functionCall?.name === 'move_to_date')

    return json({
        content: response.text(),
        history: fullHistory, // Return the full rich history turns
        moveToDate: moveCall?.functionCall?.args?.date
    })
}
