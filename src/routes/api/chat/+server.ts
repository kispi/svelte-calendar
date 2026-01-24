import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { env } from '$env/dynamic/private'
import {
  GoogleGenerativeAI,
  SchemaType,
  type Content
} from '@google/generative-ai'
import { db } from '$lib/server/db'
import { eq, and, gte, lte, asc, or, like } from 'drizzle-orm'
import {
  event as eventTable,
  note as noteTable,
  calendar as calendarTable,
  chatLog
} from '$lib/server/db/schema'
import { logger } from '$lib/logger'
import dayjs from 'dayjs'

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
            name: 'get_notes',
            description:
              'Search notes. Returns a CSV string (id|title|date|content).',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                search: {
                  type: SchemaType.STRING,
                  description: 'Optional search keyword to filter notes.'
                }
              }
            }
          }
        ]
      } as any
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
            text: `You are Gravex.app Assistant, a helpful AI built into the Gravex Planner. 
        Today is ${dayjs(clientDate || undefined).format('YYYY-MM-DD dddd')}.
        
        # Capabilities
        - Use 'get_events' to search for events. Returns CSV format (id|title|startTime|endTime|description).
        - Use 'get_notes' to search notes. Returns CSV format (id|title|updatedAt|content).
        - Use 'move_to_date' when the user clearly wants to navigate the calendar view to a specific time.
  
        # Data Interpretation
        - The 'Event' model has Title, Location, Description, StartTime, EndTime, and Type.
        - **Money/Cost**: If a user asks about "price", "cost", "expense", or "congratulatory money", LOOK INSIDE the 'description' or 'title' fields. Assume numbers found there (e.g., "50000", "50k") represent the amount.
        - **Aggregation**: You can calculate totals (e.g. "Total congratulatory money this year") by fetching relevant events first, then extracting and summing up numbers from their descriptions.
        - **Filtering**: To find "most expensive" or "cheapest", retrieve the events, parse the costs from descriptions, and sort them yourself.

        # Scope & Rejection Policy
        - **STRICTLY LIMITED SCOPE**: You generally ONLY answer questions related to the User's Calendar (Schedule) or Notes.
        - **Handling Irrelevant Questions**: If the user asks a general question unrelated to their schedule or notes (e.g., "What is the capital of France?", "Tell me a joke", "How to cook pasta", or coding questions), you MUST refuse to answer.
        - **Humorous Refusal**: When refusing, give a humorous response implying you are "just a schedule assistant" and "don't get paid to think about other things" or "my brain is only big enough for calendars".
        - **NO FUNCTION CALLS**: If you are refusing an irrelevant question, DO NOT call any functions. Just reply with the text refusal.
  
        # Rules
        - ALWAYS restrict data access to the current user.
        - Be concise and professional (except when being humorous about refusals).
        - Never modify data (READ-ONLY).`
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
          } else if (name === 'get_notes') {
            const { search } = args as { search?: string }
            const filters = [eq(noteTable.userId, userId)]
            if (search) {
              filters.push(
                or(
                  like(noteTable.title, `%${search}%`),
                  like(noteTable.content, `%${search}%`)
                ) as any
              )
            }

            const notes = await db
              .select()
              .from(noteTable)
              .where(and(...filters))
              .orderBy(asc(noteTable.updatedAt))

            toolResponses.push({
              functionResponse: {
                name: 'get_notes',
                response: { notes }
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
      moveToDate: (moveCall?.functionCall?.args as any)?.date
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
