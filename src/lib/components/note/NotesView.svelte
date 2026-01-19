<script lang="ts">
  import { createQuery, useQueryClient } from '@tanstack/svelte-query'
  import NoteList from './NoteList.svelte'
  import NoteEditor from './NoteEditor.svelte'
  import { modal } from '$lib/modal.svelte.js'
  import { i18n } from '$lib/i18n.svelte.js'
  import { settings } from '$lib/settings.svelte.js'
  import ModalConfirm from '../modals/ModalConfirm.svelte'

  let { initialNoteId = null }: { initialNoteId?: string | null } = $props()

  const queryClient = useQueryClient()
  let activeNoteId = $state<string | null>(initialNoteId)

  $effect(() => {
    settings.lastNoteId = activeNoteId
  })

  const notesQuery = createQuery(() => ({
    queryKey: ['notes'],
    queryFn: async () => {
      const res = await fetch('/api/notes')
      if (!res.ok) throw new Error('Failed to fetch notes')
      return res.json()
    }
  }))

  let activeNote = $derived(
    notesQuery.data?.find((n: any) => n.id === activeNoteId) || null
  )

  async function handleCreateNote() {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '', content: '' })
    })
    if (res.ok) {
      const newNote = await res.json()
      // Directly update the cache to avoid flickering
      queryClient.setQueryData(['notes'], (old: any[]) => [
        newNote,
        ...(old || [])
      ])
      activeNoteId = newNote.id
    }
  }

  async function handleSaveNote(data: { title: string; content: string }) {
    if (!activeNoteId) return

    // Update the local cache immediately with client-side data
    // This keeps the sidebar list in sync without requiring the server response.
    queryClient.setQueryData(['notes'], (old: any[]) => {
      if (!old) return []
      return old.map((n) =>
        n.id === activeNoteId
          ? {
              ...n,
              title: data.title,
              content: data.content,
              updatedAt: new Date()
            }
          : n
      )
    })

    await fetch(`/api/notes/${activeNoteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: data.title, content: data.content })
    })
  }

  async function handleDeleteNote() {
    if (!activeNoteId || !activeNote) return

    const isEmpty = !activeNote.title?.trim() && !activeNote.content?.trim()
    let confirmed = true

    if (!isEmpty) {
      confirmed = await modal.show(ModalConfirm, {
        title: i18n.t('notes.deleteTitle'),
        message: i18n.t('notes.deleteMessage'),
        confirmText: i18n.t('common.delete'),
        confirmClass: 'bg-red-600 text-white'
      })
    }

    if (!confirmed) return

    const res = await fetch(`/api/notes/${activeNoteId}`, {
      method: 'DELETE'
    })
    if (res.ok) {
      const deletedId = activeNoteId
      activeNoteId = null
      queryClient.setQueryData(['notes'], (old: any[] | undefined) => {
        if (!old) return []
        return old.filter((n) => n.id !== deletedId)
      })
    }
  }
</script>

<svelte:window
  onfocus={() => {
    queryClient.invalidateQueries({ queryKey: ['notes'] })
  }}
/>

<div
  class="h-[700px] bg-white rounded border border-slate-100 shadow-xl overflow-hidden flex flex-col md:flex-row relative"
>
  <!-- Sidebar -->
  <div
    class="w-full md:w-80 shrink-0 min-w-0 {activeNoteId
      ? 'hidden md:flex'
      : 'flex'} flex-col h-full border-r border-slate-100"
  >
    <!-- List Header -->
    <div
      class="flex h-14 items-center justify-between px-6 shrink-0 border-b border-slate-50 bg-slate-50/50"
    >
      <span class="text-xs font-bold text-slate-400 uppercase tracking-widest"
        >{i18n.t('notes.list')}</span
      >
      <button
        onclick={handleCreateNote}
        class="p-1.5 text-slate-400 hover:text-slate-800 transition-colors active:scale-95"
        aria-label={i18n.t('notes.create')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path
            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
          /><path
            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
          /></svg
        >
      </button>
    </div>

    <div class="flex-1 w-full overflow-hidden">
      <NoteList
        notes={notesQuery.data || []}
        {activeNoteId}
        onSelect={(id) => (activeNoteId = id)}
      />
    </div>
  </div>

  <!-- Editor Content -->
  <div
    class="flex-1 {activeNoteId
      ? 'flex'
      : 'hidden md:flex'} flex-col h-full relative"
  >
    {#if activeNote}
      <NoteEditor
        note={activeNote}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        onBack={() => (activeNoteId = null)}
      />
    {:else}
      <div
        class="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50/30"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mb-4 opacity-20"
          ><path
            d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
          /><polyline points="14 2 14 8 20 8" /></svg
        >
        <p class="text-sm font-medium">{i18n.t('notes.empty')}</p>
      </div>
    {/if}
  </div>
</div>
