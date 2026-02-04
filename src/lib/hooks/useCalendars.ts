import { createQuery, useQueryClient as useTanStackQueryClient } from '@tanstack/svelte-query'

export const useCalendars = () => {
  return createQuery(() => ({
    queryKey: ['calendars'],
    queryFn: async () => {
      const res = await fetch('/api/calendars')
      if (!res.ok) throw new Error('Failed to fetch calendars')
      return res.json()
    },
    refetchOnWindowFocus: false
  }))
}

export const useQueryClient = useTanStackQueryClient
