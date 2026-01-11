<script>
  import { createQuery, useQueryClient } from '@tanstack/svelte-query'
  import NoteList from './NoteList.svelte'
  import NoteEditor from './NoteEditor.svelte'
  import { modal } from '$lib/modal.svelte.js'
  import ConfirmModal from './ConfirmModal.svelte'

  const queryClient = useQueryClient()
  /** @type {string | null} */
  let activeNoteId = $state(null)

  const notesQuery = createQuery(() => ({
    queryKey: ['notes'],
    queryFn: async () => {
      const res = await fetch('/api/notes')
      if (!res.ok) throw new Error('Failed to fetch notes')
      return res.json()
    }
  }))

  let activeNote = $derived(
    notesQuery.data?.find((/** @type {any} */ n) => n.id === activeNoteId) ||
      null
  )

  async function handleCreateNote() {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '', content: '' })
    })
    if (res.ok) {
      const newNote = await res.json()
      await queryClient.invalidateQueries({ queryKey: ['notes'] })
      activeNoteId = newNote.id
    }
  }

  /** @param {{ title: string, content: string }} data */
  async function handleSaveNote(data) {
    if (!activeNoteId) return
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: activeNoteId, ...data })
    })
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    }
  }

  async function handleDeleteNote() {
    if (!activeNoteId) return

    const confirmed = await modal.show(ConfirmModal, {
      title: 'Delete Note',
      message:
        'Are you sure you want to delete this note? This cannot be undone.',
      confirmText: 'Delete',
      confirmClass: 'bg-red-600'
    })

    if (!confirmed) return

    const res = await fetch(`/api/notes/${activeNoteId}`, {
      method: 'DELETE'
    })
    if (res.ok) {
      activeNoteId = null
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    }
  }
</script>

<div
  class="h-[700px] bg-white rounded border border-slate-100 shadow-xl overflow-hidden flex flex-col md:flex-row relative"
>
  <!-- Mobile Header (Visible only when no note selected or on list) -->
  <div
    class="md:hidden h-14 border-b border-slate-100 flex items-center justify-between px-4 shrink-0 bg-white"
  >
    <h2 class="font-bold text-slate-800">Notes</h2>
    <button
      onclick={handleCreateNote}
      class="p-2 text-slate-400 hover:text-slate-800 rounded transition-all"
      aria-label="Create note"
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

  <!-- Sidebar -->
  <div
    class="w-full md:w-80 shrink-0 {activeNoteId
      ? 'hidden md:flex'
      : 'flex'} flex-col h-full border-r border-slate-100"
  >
    <!-- Desktop List Header -->
    <div
      class="hidden md:flex h-14 items-center justify-between px-6 shrink-0 border-b border-slate-50 bg-slate-50/50"
    >
      <span class="text-xs font-bold text-slate-400 uppercase tracking-widest"
        >List</span
      >
      <button
        onclick={handleCreateNote}
        class="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-white rounded shadow-sm transition-all active:scale-95"
        aria-label="Create note"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
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

    <div class="flex-1 overflow-hidden">
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
      <!-- Back button for mobile -->
      <button
        onclick={() => (activeNoteId = null)}
        class="md:hidden absolute top-4 left-4 z-20 p-2 text-slate-400 hover:text-slate-800 bg-white/50 backdrop-blur-sm rounded-full"
        aria-label="Back to list"
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
          stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg
        >
      </button>

      <NoteEditor
        note={activeNote}
        isSaving={false}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
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
        <p class="text-sm font-medium">Select a note to view or edit</p>
      </div>
    {/if}
  </div>
</div>
