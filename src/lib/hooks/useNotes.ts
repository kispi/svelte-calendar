import { createQuery, useQueryClient as useTanStackQueryClient } from '@tanstack/svelte-query'

export const useNotes = () => {
  return createQuery(() => ({
    queryKey: ['notes'],
    queryFn: async () => {
      const res = await fetch('/api/notes')
      if (!res.ok) throw new Error('Failed to fetch notes')
      return res.json()
    }
  }))
}

export const useQueryClient = useTanStackQueryClient
