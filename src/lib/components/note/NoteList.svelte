<script lang="ts">
  import dayjs from 'dayjs'
  import { i18n } from '$lib/i18n.svelte.js'
  import type { Note } from '$lib/server/db/schema'

  interface NoteListProps {
    notes?: Note[]
    activeNoteId?: string | null
    onSelect: (id: string) => void
  }

  let { notes = [], activeNoteId = null, onSelect }: NoteListProps = $props()

  const getPreview = (note: Note) => {
    const content = note.content
    if (!content) {
      return i18n.t('notes.noContent')
    }

    // If note has a title, show full content as preview
    if (note.title) {
      const preview = content.replace(/\n/g, ' ').trim()
      return preview || i18n.t('notes.noContent')
    }

    // If note has no title, first line is used as title, so show rest as preview
    const lines = content.split('\n')
    const preview = lines.slice(1).join(' ').trim()
    return preview || i18n.t('notes.noContent')
  }

  const getTitle = (note: Note) => {
    if (note.title) {
      return note.title
    }
    if (note.content) {
      return note.content.split('\n')[0]
    }
    return i18n.t('notes.untitled')
  }
</script>

<div
  class="flex flex-col h-full w-full bg-slate-50/50 dark:bg-slate-800/50 border-r border-slate-100 dark:border-slate-700 overflow-x-hidden"
>
  <div class="flex-1 overflow-y-auto overflow-x-hidden">
    {#if notes.length === 0}
      <div class="p-8 text-center">
        <p class="text-sm text-slate-400 dark:text-slate-500">
          {i18n.t('notes.noNotesYet')}
        </p>
      </div>
    {:else}
      <div class="grid gap-px w-full">
        {#each notes as note (note.id)}
          <div class="px-2 py-1 min-w-0">
            <button
              onclick={() => onSelect(note.id)}
              class="group w-full text-left p-4 transition-all relative rounded-md overflow-hidden
                     {activeNoteId === note.id
                ? 'bg-white dark:bg-slate-950 shadow-lg ring-1 ring-slate-200/50 dark:ring-slate-700/50 z-10 scale-[1.02]'
                : 'hover:bg-slate-100/50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400'}"
            >
              <div class="flex flex-col gap-1 min-w-0 w-full">
                <span
                  class="block text-sm font-bold truncate w-full {activeNoteId ===
                  note.id
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-700 dark:text-slate-300'}"
                >
                  {getTitle(note)}
                </span>
                <div class="flex items-center gap-2 min-w-0 w-full">
                  <span
                    class="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0"
                  >
                    {dayjs(note.updatedAt).format('M/D/YY')}
                  </span>
                  <span
                    class="block text-xs text-slate-400 dark:text-slate-500 truncate opacity-70 flex-1 min-w-0"
                  >
                    {getPreview(note)}
                  </span>
                </div>
              </div>
              {#if activeNoteId === note.id}
                <div
                  class="absolute left-0 top-3 bottom-3 w-1 bg-gravex-primary-600 dark:bg-gravex-primary-500 rounded-r shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                ></div>
              {/if}
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
