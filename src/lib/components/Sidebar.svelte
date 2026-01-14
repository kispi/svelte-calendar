<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { i18n } from '$lib/i18n.svelte.js'
  import { modal } from '$lib/modal.svelte.js'
  import ModalConfirm from './modals/ModalConfirm.svelte'
  import { createQuery, useQueryClient } from '@tanstack/svelte-query'

  import Skeleton from '$lib/components/ui/Skeleton.svelte'

  interface SidebarProps {
    visibleCalendarIds: string[]
    onToggle: (id: string, visible: boolean) => void
    class?: string
    children?: any
  }

  let {
    visibleCalendarIds = [],
    onToggle,
    class: className = '',
    children
  }: SidebarProps = $props()

  const queryClient = useQueryClient()

  // Fetch Calendars
  const query = createQuery(() => ({
    queryKey: ['calendars'],
    queryFn: async () => {
      const res = await fetch('/api/calendars')
      if (!res.ok) throw new Error('Failed to fetch calendars')
      return res.json()
    }
  }))

  let isCreating = $state(false)
  let newCalendarName = $state('')
  let newCalendarColor = $state('#3b82f6') // Blue default

  function focusNode(node: HTMLElement) {
    node.focus()
  }

  const PRESET_COLORS = [
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Amber
    '#84cc16', // Lime
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#d946ef', // Fuchsia
    '#f43f5e', // Rose
    '#64748b' // Slate
  ]

  async function handleCreate(e: Event) {
    e.preventDefault()
    if (!newCalendarName.trim()) return

    try {
      const res = await fetch('/api/calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCalendarName,
          color: newCalendarColor
        })
      })

      if (res.ok) {
        newCalendarName = ''
        isCreating = false
        queryClient.invalidateQueries({ queryKey: ['calendars'] })
      }
    } catch (err) {
      console.error('Failed to create calendar', err)
    }
  }

  async function handleDelete(id: string, name: string) {
    const confirmed = await modal.show(ModalConfirm, {
      title: i18n.t('common.delete'),
      message: `${name} - ${i18n.locale === 'kr' ? '정말 삭제하시겠습니까? 이 캘린더의 모든 일정이 삭제됩니다.' : 'Are you sure? All events in this calendar will be deleted.'}`,
      confirmText: i18n.t('common.delete'),
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white'
    })

    if (confirmed) {
      try {
        const res = await fetch(`/api/calendars/${id}`, { method: 'DELETE' })
        if (res.ok) {
          queryClient.invalidateQueries({ queryKey: ['calendars'] })
          queryClient.invalidateQueries({ queryKey: ['events'] })
        }
      } catch (err) {
        console.error('Failed to delete', err)
      }
    }
  }

  // Initialize visibility
  $effect(() => {
    if (query.data && visibleCalendarIds.length === 0) {
      // If no visibility is set, default to all visible?
      // Or let parent handle that.
      // Actually, we should probably emit logic to parent if mostly empty?
      // But for now, let's just assume parent controls it.
    }
  })
</script>

<div
  class="w-64 h-full flex flex-col border-r border-slate-100 bg-slate-50/50 p-4 {className}"
>
  <!-- Calendars Header -->
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest">
      {i18n.locale === 'kr' ? '내 캘린더' : 'My Calendars'}
    </h2>
    <button
      class="text-slate-400 hover:text-justodo-green-600 transition-colors"
      onclick={() => (isCreating = !isCreating)}
      title="Add Calendar"
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
        class="lucide lucide-plus"
        ><path d="M5 12h14" /><path d="M12 5v14" /></svg
      >
    </button>
  </div>

  <!-- Create Form -->
  {#if isCreating}
    <form
      onsubmit={handleCreate}
      class="mb-4 bg-white p-3 rounded-lg shadow-sm border border-slate-100 animate-in slide-in-from-top-2 fade-in duration-200"
    >
      <input
        type="text"
        bind:value={newCalendarName}
        placeholder={i18n.locale === 'kr' ? '캘린더 이름' : 'Calendar Name'}
        class="w-full text-sm font-medium border-b border-slate-100 focus:border-justodo-green-400 outline-none pb-1 mb-3 placeholder:text-slate-300"
        use:focusNode
      />

      <div class="flex flex-wrap gap-1.5 mb-3">
        {#each PRESET_COLORS as color}
          <button
            type="button"
            class="w-4 h-4 rounded-full transition-transform hover:scale-110 focus:ring-2 ring-offset-1 ring-slate-200"
            style="background-color: {color}; transform: {newCalendarColor ===
            color
              ? 'scale(1.2)'
              : 'scale(1)'}"
            onclick={() => (newCalendarColor = color)}
            aria-label="Select color"
          ></button>
        {/each}
      </div>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          onclick={() => (isCreating = false)}
          class="text-[10px] uppercase font-bold text-slate-400 hover:text-slate-600"
        >
          {i18n.t('common.cancel')}
        </button>
        <button
          type="submit"
          class="text-[10px] uppercase font-bold text-justodo-green-600 hover:text-justodo-green-700"
        >
          {i18n.t('common.save')}
        </button>
      </div>
    </form>
  {/if}

  <!-- List -->
  {#if query.isLoading}
    <div class="space-y-2">
      {#each { length: 3 } as _}
        <Skeleton class="h-6 w-full" />
      {/each}
    </div>
  {:else if query.data}
    <div class="space-y-1">
      {#each query.data as cal (cal.id)}
        <div
          class="group flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-white/60 transition-colors"
        >
          <label
            class="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
          >
            <div class="relative flex items-center justify-center">
              <input
                type="checkbox"
                class="peer appearance-none w-4 h-4 rounded border border-slate-300 checked:border-transparent transition-all"
                style="background-color: {visibleCalendarIds.includes(cal.id)
                  ? cal.color
                  : 'transparent'}; border-color: {visibleCalendarIds.includes(
                  cal.id
                )
                  ? cal.color
                  : '#cbd5e1'}"
                checked={visibleCalendarIds.includes(cal.id)}
                onchange={(e) => onToggle(cal.id, e.currentTarget.checked)}
              />
              <svg
                class="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><polyline points="20 6 9 17 4 12"></polyline></svg
              >
            </div>
            <span class="text-sm font-medium text-slate-700 truncate"
              >{cal.name}</span
            >
          </label>

          <!-- Actions -->
          {#if cal.role === 'owner' && !cal.isPrimary}
            <button
              class="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
              onclick={() => handleDelete(cal.id, cal.name)}
              title="Delete Calendar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-trash-2"
                ><path d="M3 6h18" /><path
                  d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                /><path d="M8 6V4c0-1 1-2 2-2h4c0 1 1 2 2 2v2" /><line
                  x1="10"
                  x2="10"
                  y1="11"
                  y2="17"
                /><line x1="14" x2="14" y1="11" y2="17" /></svg
              >
            </button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  {@render children?.()}
</div>
