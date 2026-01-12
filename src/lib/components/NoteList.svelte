<script>
  import dayjs from 'dayjs'

  /**
   * @typedef {Object} NoteListProps
   * @property {any[]} notes
   * @property {string | null} activeNoteId
   * @property {(id: string) => void} onSelect
   */

  /** @type {NoteListProps} */
  let { notes = [], activeNoteId = null, onSelect } = $props()

  /** @param {string | null} content */
  function getPreview(content) {
    if (!content) return 'No additional text'
    const lines = content.split('\n')
    return lines.slice(1).join(' ').trim() || 'No additional text'
  }
</script>

<div
  class="flex flex-col h-full w-full bg-slate-50/50 border-r border-slate-100 overflow-x-hidden"
>
  <div class="flex-1 overflow-y-auto overflow-x-hidden">
    {#if notes.length === 0}
      <div class="p-8 text-center">
        <p class="text-sm text-slate-400">No notes yet</p>
      </div>
    {:else}
      <div class="grid gap-px w-full">
        {#each notes as note (note.id)}
          <div class="px-2 py-1 min-w-0">
            <button
              onclick={() => onSelect(note.id)}
              class="group w-full text-left p-4 transition-all relative rounded-md overflow-hidden
                     {activeNoteId === note.id
                ? 'bg-white shadow-lg ring-1 ring-slate-200/50 z-10 scale-[1.02]'
                : 'hover:bg-slate-100/50 text-slate-600'}"
            >
              <div class="flex flex-col gap-1 min-w-0 w-full">
                <span
                  class="block text-sm font-bold truncate w-full {activeNoteId ===
                  note.id
                    ? 'text-slate-900'
                    : 'text-slate-700'}"
                >
                  {note.title ||
                    (note.content
                      ? note.content.split('\n')[0]
                      : 'Untitled Note')}
                </span>
                <div class="flex items-center gap-2 min-w-0 w-full">
                  <span class="text-[10px] text-slate-400 font-mono shrink-0">
                    {dayjs(note.updatedAt).format('M/D/YY')}
                  </span>
                  <span
                    class="block text-xs text-slate-400 truncate opacity-70 flex-1 min-w-0"
                  >
                    {getPreview(note.content)}
                  </span>
                </div>
              </div>
              {#if activeNoteId === note.id}
                <div
                  class="absolute left-0 top-3 bottom-3 w-1 bg-justodo-green-600 rounded-r shadow-[0_0_8px_rgba(5,150,105,0.4)]"
                ></div>
              {/if}
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
