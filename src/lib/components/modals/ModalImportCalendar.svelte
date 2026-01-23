<script lang="ts">
  import { i18n } from '$lib/i18n.svelte.js'
  import dayjs from 'dayjs'

  interface ImportProps {
    events: any[]
    close: (value?: any) => void
  }

  let { events, close }: ImportProps = $props()

  // Default: Select all
  let selectedIds = $state<Set<string>>(new Set())

  $effect(() => {
    // Initialize or update selection when events change
    selectedIds = new Set(events.map((e) => e.id))
  })

  const toggle = (id: string) => {
    if (selectedIds.has(id)) {
      selectedIds.delete(id)
    } else {
      selectedIds.add(id)
    }
    // Re-assign to trigger reactivity if needed (Set distinct mutation might not trigger in some versions, but Svelte 5 proxies usually handle it if we use $state correctly.
    // Ideally, for Set, we might need to create a new Set or use a reactive Map/Array.
    // Let's use re-assignment for safety:
    selectedIds = new Set(selectedIds)
  }

  const toggleAll = () => {
    if (selectedIds.size === events.length) {
      selectedIds = new Set()
    } else {
      selectedIds = new Set(events.map((e) => e.id))
    }
  }

  const handleImport = async () => {
    const selectedEvents = events.filter((e) => selectedIds.has(e.id))
    close({ success: true, selectedEvents })
  }
</script>

<div class="p-6 relative max-h-[80vh] flex flex-col">
  <h3 class="text-xl font-bold text-slate-900 mb-2">
    {i18n.locale === 'kr' ? '일정 가져오기' : 'Import Events'}
  </h3>
  <p class="text-sm text-slate-500 mb-6">
    {i18n.locale === 'kr'
      ? `${events.length}개의 일정을 찾았습니다. 가져올 일정을 선택해주세요.`
      : `Found ${events.length} events. Select the events you want to import.`}
  </p>

  <div class="flex items-center justify-between mb-4 px-1">
    <button
      onclick={toggleAll}
      class="text-sm font-bold text-gravex-green-600 hover:text-gravex-green-700"
    >
      {selectedIds.size === events.length
        ? i18n.locale === 'kr'
          ? '전체 해제'
          : 'Deselect All'
        : i18n.locale === 'kr'
          ? '전체 선택'
          : 'Select All'}
    </button>
    <span class="text-sm text-slate-400">
      {selectedIds.size} / {events.length}
    </span>
  </div>

  <div
    class="flex-1 overflow-y-auto custom-scrollbar border rounded-lg border-slate-100 divide-y divide-slate-50"
  >
    {#each events as event}
      <label
        class="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors"
      >
        <div class="pt-0.5">
          <input
            type="checkbox"
            checked={selectedIds.has(event.id)}
            onchange={() => toggle(event.id)}
            class="w-4 h-4 rounded text-gravex-green-600 focus:ring-gravex-green-500 border-slate-300"
          />
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-slate-800 truncate">
            {event.title}
          </div>
          <div class="text-xs text-slate-400 mt-0.5">
            {dayjs(event.startTime).format('YYYY-MM-DD HH:mm')}
            {#if event.location}
              <span class="mx-1">•</span>
              {event.location}
            {/if}
          </div>
        </div>
      </label>
    {/each}
  </div>

  <div class="flex justify-end gap-3 pt-6 mt-2 border-t border-slate-50">
    <button onclick={() => close()} class="btn-default">
      {i18n.t('common.cancel')}
    </button>
    <button
      onclick={handleImport}
      disabled={selectedIds.size === 0}
      class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {i18n.locale === 'kr'
        ? `${selectedIds.size}개 가져오기`
        : `Import ${selectedIds.size}`}
    </button>
  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 20px;
  }
</style>
