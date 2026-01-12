<script>
  import { onDestroy } from 'svelte'

  /**
   * @typedef {Object} NoteEditorProps
   * @property {any} note
   * @property {(data: { title: string, content: string }) => void} onSave
   * @property {() => void} onDelete
   * @property {() => void} [onBack]
   */

  /** @type {NoteEditorProps} */
  let { note, onSave, onDelete, onBack } = $props()

  let title = $state('')
  let content = $state('')
  let lastSyncedNoteId = $state(null)

  $effect(() => {
    // Only synchronize local state when the selected note actually changes (ID change).
    // This completely prevents background sync/refetches from resetting the cursor.
    if (note && note.id !== lastSyncedNoteId) {
      title = note.title || ''
      content = note.content || ''
      lastSyncedNoteId = note.id
    }
  })

  // Debounced auto-save
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout

  function handleInput() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      const lines = content.split('\n')
      const derivedTitle = lines[0].trim().substring(0, 50) || 'Untitled Note'

      onSave({
        title: title || derivedTitle,
        content
      })
    }, 1000)
  }

  onDestroy(() => {
    clearTimeout(timeout)
  })
</script>

<div class="flex flex-col h-full bg-white overflow-hidden">
  <!-- Toolbar -->
  <div
    class="h-14 border-b border-slate-100 flex items-center justify-between px-6 shrink-0"
  >
    <div class="flex items-center">
      {#if onBack}
        <button
          onclick={onBack}
          class="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-800 rounded-full transition-all"
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
      {/if}
    </div>

    <div class="flex items-center gap-2">
      <button
        onclick={onDelete}
        class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
        aria-label="Delete note"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path d="M3 6h18" /><path
            d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
          /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line
            x1="10"
            y1="11"
            x2="10"
            y2="17"
          /><line x1="14" y1="11" x2="14" y2="17" /></svg
        >
      </button>
    </div>
  </div>

  <!-- Editor -->
  <div class="flex-1 p-8 overflow-y-auto">
    <div class="max-w-3xl mx-auto flex flex-col h-full gap-4">
      <input
        type="text"
        placeholder="Note Title"
        bind:value={title}
        oninput={handleInput}
        class="text-3xl font-black text-slate-900 border-none outline-none placeholder:text-slate-200"
      />
      <textarea
        placeholder="Start writing..."
        bind:value={content}
        oninput={handleInput}
        class="flex-1 w-full text-lg leading-relaxed text-slate-700 border-none outline-none resize-none placeholder:text-slate-200 min-h-[500px]"
      ></textarea>
    </div>
  </div>
</div>
