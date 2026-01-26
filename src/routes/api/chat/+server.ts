import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { env } from '$env/dynamic/private'
import {
  GoogleGenerativeAI,
  SchemaType,
  type Content
} from '@google/generative-ai'
import { db } from '$lib/server/db'
import { eq, and, gte, lte, asc } from 'drizzle-orm'
import {
  event as eventTable,
  calendar as calendarTable,
  chatLog
} from '$lib/server/db/schema'
import { createEvent } from '$lib/server/events'
import { logger } from '$lib/logger'
import dayjs from 'dayjs'
import readmeContent from '../../../../README.md?raw'

if (!env.GOOGLE_AI_API_KEY) {
  logger.error(
    '[AI Chat] GOOGLE_AI_API_KEY is missing in environment variables!'
  )
}
const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY || '')

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = await locals.auth()
  if (!session?.user?.id) {
    throw error(401, 'Unauthorized')
  }

  const userId = session.user.id
  const { messages, clientDate } = await request.json()
  const startTime = new Date()
  let responseText = ''
  let functionCallsLog: any[] = []
  let isSuccess = true
  let errorLog: any = null
  let createdEvent: any = null

  try {
    // Define tools for Gemini
    const tools = [
      {
        functionDeclarations: [
          {
            name: 'get_events',
            description:
              'Fetch events. Returns a CSV string (id|title|start|end|desc).',
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
            description:
              'Signal the calendar UI to move to a specific date or month.',
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
          },
          {
            name: 'create_event',
            description: 'Create a new event/schedule in the calendar.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                title: {
                  type: SchemaType.STRING,
                  description: 'Title of the event'
                },
                startTime: {
                  type: SchemaType.STRING,
                  description:
                    'Start time in ISO 8601 format (YYYY-MM-DDTHH:mm:ss). The server time is strictly UTC, so if an offset is not provided, it will be recognized as UTC.'
                },
                endTime: {
                  type: SchemaType.STRING,
                  description:
                    'End time in ISO 8601 format (YYYY-MM-DDTHH:mm:ss). The server time is strictly UTC, so if an offset is not provided, it will be recognized as UTC.'
                },
                location: {
                  type: SchemaType.STRING,
                  description: 'Location of the event (optional)'
                },
                description: {
                  type: SchemaType.STRING,
                  description: 'Description of the event (optional)'
                },
                recurrenceRule: {
                  type: SchemaType.STRING,
                  description: 'RRULE string for recurring events (e.g., "FREQ=WEEKLY;BYDAY=MO")'
                }
              },
              required: ['title', 'startTime', 'endTime']
            }
          }
        ]
      } as any,
      {
        functionDeclarations: [
          {
            name: 'get_app_info',
            description: 'Get information about this application features, tech stack, and capabilities.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {},
              required: []
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
    const history: Content[] = messages
      .slice(0, -1)
      .map((m: any) => ({
        role: m.role,
        parts: m.parts
      }))
      .filter((msg: any, index: number) => {
        // Gemini history MUST start with 'user' role
        if (index === 0 && msg.role !== 'user') return false
        return true
      })

    const chat = model.startChat({
      history,
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: `You are Gravex.app Assistant, a dedicated schedule management assistant. 
        Today is ${dayjs(clientDate || undefined).format('YYYY-MM-DD dddd')}.
        
        # Role & Identity
        - You are strictly a tool for managing schedules.
        - You are NOT a general-purpose replacement for ChatGPT.
        
        # Capabilities
        - Use 'get_events' to search for events/schedules. Returns CSV format.
        - Use 'move_to_date' to navigate the calendar.
        - Use 'create_event' to add new schedules.
        - Use 'get_app_info' for app-specific questions.
        
        # Handling Questions (CRITICAL)
        1. **Schedule**: ALWAYS handle requests related to creating, finding, or managing schedules using the provided tools.
        2. **Date/Time/Holidays**: ALWAYS answer questions about dates, times, days of the week, or holidays (e.g., "What day is next Friday?", "When is Chuseok?"). This is essential for scheduling.
        3. **General Knowledge**: REJECT all other questions unrelated to scheduling (e.g., history, math, science, daily news, "capital of UK").
           - **Refusal Message**: "죄송합니다. 일정 관련 질문에만 답변할 수 있습니다. 😊"
           - **Do NOT** provide the answer even if you know it. Just refuse to save tokens.
  
        # Data Interpretation
        - The 'Event' model has Title, Location, Description, StartTime, EndTime, and Type.
        - **Money/Cost**: If a user asks about "price", "cost", "expense", or "congratulatory money", LOOK INSIDE the 'description' or 'title' fields. Assume numbers found there (e.g., "50000", "50k") represent the amount.
        - **Aggregation**: You can calculate totals (e.g. "Total congratulatory money this year") by fetching relevant events first, then extracting and summing up numbers from their descriptions.
        - **Filtering**: To find "most expensive" or "cheapest", retrieve the events, parse the costs from descriptions, and sort them yourself.

        # Event Creation Rules
        - **Timezone**: The server's timezone is **UTC**. When parsing relative times (e.g., '6pm'), be aware that without a timezone offset, it will be treated as UTC. If the user implies a local time (e.g. KST), please include the timezone offset in the ISO string.
        - **Recurrence**:
          - **NEVER use 'BYDAY'**. Our system does not support complex recurrence with 'BYDAY'.
          - Use ONLY simple frequencies like 'FREQ=WEEKLY', 'FREQ=DAILY', 'FREQ=MONTHLY'.
          - If the user asks for multiple days (e.g., "Every Mon and Wed"), **YOU MUST only create ONE of them** (e.g. only Monday) using 'FREQ=WEEKLY'.
          - Then, explicitly tell the user: "System policy allows registering only one recurrence pattern at a time. I have registered the [Day] schedule first. Please ask me to register the other days separately."
        - **Intent**: You should infer the intent to create an event even if the user doesn't say "create" explicitly (e.g., "Dinner with Mom next Friday at 7pm", "Register gym schedule every Mon/Wed").
        - **One-off vs Recurring**: If no recurrence is implied, leave 'recurrenceRule' empty.
  
        # Safety Rules
        - **Security & Privacy**: NEVER answer questions about the **deployment environment** (EC2, PM2, GitHub Actions, AWS) or **environment variables** (.env files, API keys, secrets). If asked, respectfully decline by saying this is private system information.
        - ALWAYS restrict data access to the current user.
        - **Never modify or delete EXISTING data.** However, you are explicitly **ALLOWED to CREATE** new events.`
          }
        ]
      }
    })

    const lastMessage = messages[messages.length - 1]
    // lastMessage should be { role: 'user', parts: [{ text: '...' }] }
    const result = await chat.sendMessage(lastMessage.parts)
    let response = result.response

    // Handle function calls in a loop (for complex multi-step queries)
    let callCount = 0
    while (
      response.candidates?.[0]?.content?.parts?.some((p) => p.functionCall) &&
      callCount < 5
    ) {
      callCount++
      const parts = response.candidates[0].content.parts
      const toolResponses = []

      // Log function calls
      const calls = parts
        .filter((p) => p.functionCall)
        .map((p) => p.functionCall)
      functionCallsLog.push(...calls)

      for (const part of parts) {
        if (part.functionCall) {
          const { name, args } = part.functionCall
          if (name === 'get_events') {
            const { startDate, endDate } = args as {
              startDate: string
              endDate: string
            }
            const events = await db
              .select({
                id: eventTable.id,
                title: eventTable.title,
                description: eventTable.description,
                location: eventTable.location,
                startTime: eventTable.startTime,
                endTime: eventTable.endTime,
                type: eventTable.type
              })
              .from(eventTable)
              .innerJoin(
                calendarTable,
                eq(eventTable.calendarId, calendarTable.id)
              )
              .where(
                and(
                  eq(calendarTable.userId, userId),
                  gte(
                    eventTable.startTime,
                    dayjs(startDate).startOf('day').toDate()
                  ),
                  lte(
                    eventTable.startTime,
                    dayjs(endDate).endOf('day').toDate()
                  )
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
            const { date } = args as { date: string }
            toolResponses.push({
              functionResponse: {
                name: 'move_to_date',
                response: { success: true, movedTo: date }
              }
            })
          } else if (name === 'get_app_info') {
            toolResponses.push({
              functionResponse: {
                name: 'get_app_info',
                response: { info: readmeContent }
              }
            })
          } else if (name === 'create_event') {
            try {
              const { title, startTime, endTime, location, description, recurrenceRule } = args as any
              // Call the service
              const newEvent = await createEvent(userId, {
                title,
                startTime: startTime ? new Date(startTime) : null,
                endTime: endTime ? new Date(endTime) : null,
                location,
                description,
                recurrenceRule
              })

              createdEvent = newEvent

              toolResponses.push({
                functionResponse: {
                  name: 'create_event',
                  response: { success: true, createdEvent: newEvent }
                }
              })
            } catch (e: any) {
              toolResponses.push({
                functionResponse: {
                  name: 'create_event',
                  response: { success: false, error: e.message }
                }
              })
            }
          }
        }
      }

      if (toolResponses.length > 0) {
        const toolResult = await chat.sendMessage(toolResponses)
        response = toolResult.response
      }
    }

    responseText = response.text()
    const fullHistory = await chat.getHistory()
    const allParts = fullHistory.flatMap((h) => h.parts)
    const moveCall = allParts.find(
      (p) => p.functionCall?.name === 'move_to_date'
    )

    // Capture any remaining function calls from the final response if any (unlikely but possible)
    // Actually, functionCallsLog collects them from the loop. We might miss the final one if it's not a loop but a single call that ends?
    // The previous logic was: JSON.stringify(allParts.filter((p) => p.functionCall).map((p) => p.functionCall))
    // Let's stick to that for the log to be safe and complete.
    functionCallsLog = allParts
      .filter((p) => p.functionCall)
      .map((p) => p.functionCall)

    return json({
      content: responseText,
      history: fullHistory,
      moveToDate: (moveCall?.functionCall?.args as any)?.date,
      createdEvent
    })
  } catch (err: any) {
    isSuccess = false
    errorLog = err
    logger.error('Chat API Error', { error: err })
    throw error(500, err.message || 'Internal Server Error')
  } finally {
    const endTime = new Date()
    const duration = endTime.getTime() - startTime.getTime()

    // Log to DB (Fire and forget)
    db.insert(chatLog)
      .values({
        userId,
        request: messages[messages.length - 1]?.parts?.[0]?.text || '',
        response: isSuccess ? responseText : (errorLog?.message ?? 'Error'),
        functionCalls: JSON.stringify(functionCallsLog),
        model: 'gemini-3-flash-preview',
        startTime,
        duration,
        isSuccess: isSuccess ? 1 : 0
      })
      .catch((err) => {
        logger.error('Failed to save chat log', { error: err })
      })
  }
}
