import { createQuery, keepPreviousData } from '@tanstack/svelte-query'

interface UseEventsOptions {
  start: string
  end: string
  enabled?: boolean
}

export const useEvents = (options: () => UseEventsOptions) => {
  return createQuery(() => {
    const opts = options()
    return {
      queryKey: ['events', { start: opts.start, end: opts.end }],
      queryFn: async () => {
        const params = new URLSearchParams({
          start: opts.start,
          end: opts.end
        })
        const res = await fetch(`/api/events?${params}`)
        if (!res.ok) throw new Error('Failed to fetch events')
        return res.json()
      },
      enabled: opts.enabled !== false,
      placeholderData: keepPreviousData,
      refetchOnWindowFocus: false
    }
  })
}
