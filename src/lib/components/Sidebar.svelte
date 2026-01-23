<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { page } from '$app/stores'
  import { i18n } from '$lib/i18n.svelte.js'
  import { settings } from '$lib/store/settings.svelte'
  import { modal } from '$lib/modal.svelte.js'
  import ModalConfirm from './modals/ModalConfirm.svelte'
  import ModalConfirmDanger from './modals/ModalConfirmDanger.svelte'
  import { createQuery, useQueryClient } from '@tanstack/svelte-query'
  import { logger } from '$lib/logger'

  import Skeleton from '$lib/components/ui/Skeleton.svelte'

  interface SidebarProps {
    visibleCalendarIds: string[]
    onToggle: (id: string, visible: boolean) => void
    class?: string
    children?: any
    activeTab?: string
    onSignOut?: () => void
    onImport?: () => void
    onExport?: () => void
    onLocaleChange?: () => void
    onTabChange?: () => void
  }

  let {
    visibleCalendarIds = [],
    onToggle,
    class: className = '',
    children,
    activeTab = $bindable('calendar'),
    onSignOut,
    onImport,
    onExport,
    onLocaleChange,
    onTabChange
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

  let editingId = $state<string | null>(null)
  let editName = $state('')
  let editColor = $state('')

  const focusNode = (node: HTMLElement) => {
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

  const handleCreate = async (e: Event) => {
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
      logger.error('Failed to create calendar', { error: err })
    }
  }

  const handleDelete = async (id: string, name: string) => {
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
        logger.error('Failed to delete', { error: err })
      }
    }
  }

  const startEdit = (cal: any) => {
    editingId = cal.id
    editName = cal.name
    editColor = cal.color
  }

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) {
      editingId = null
      return
    }

    try {
      const res = await fetch(`/api/calendars/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, color: editColor })
      })

      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['calendars'] })
      }
    } catch (err) {
      logger.error('Failed to update calendar', { error: err })
    } finally {
      editingId = null
    }
  }

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit()
    } else if (e.key === 'Escape') {
      editingId = null
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = await modal.show(ModalConfirmDanger, {
      title: i18n.t('nav.deleteAccountTitle'),
      message: i18n.t('nav.deleteAccountConfirm'),
      confirmText: i18n.t('nav.deleteAccountPhrase'),
      actionText: i18n.t('nav.deleteAccount')
    })

    if (confirmed) {
      try {
        const userId = $page.data.session?.user?.id
        if (!userId) return

        const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
        if (res.ok) {
          window.location.href = '/'
        } else {
          logger.error('Failed to delete account')
        }
      } catch (err) {
        logger.error('Failed to delete account', { error: err })
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
  class="w-full h-full flex flex-col p-4 {className} bg-slate-50 dark:bg-slate-950 transition-colors duration-300"
>
  <!-- Navigation -->
  <div class="mb-6 space-y-1">
    <button
      onclick={() => {
        activeTab = 'calendar'
        onTabChange?.()
      }}
      class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all {activeTab ===
      'calendar'
        ? 'bg-white dark:bg-slate-800 text-gravex-primary-600 dark:text-gravex-primary-400 shadow-sm dark:shadow-none font-bold'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 font-medium'}"
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
        class="lucide lucide-calendar opacity-80"
        ><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line
          x1="16"
          x2="16"
          y1="2"
          y2="6"
        /><line x1="8" x2="8" y1="2" y2="6" /><line
          x1="3"
          x2="21"
          y1="10"
          y2="10"
        /></svg
      >
      <span class="text-sm tracking-tight">{i18n.t('nav.calendar')}</span>
    </button>
    <button
      onclick={() => {
        activeTab = 'notes'
        onTabChange?.()
      }}
      class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all {activeTab ===
      'notes'
        ? 'bg-white dark:bg-slate-800 text-gravex-primary-600 dark:text-gravex-primary-400 shadow-sm dark:shadow-none font-bold'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 font-medium'}"
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
        class="lucide lucide-sticky-note opacity-80"
        ><path
          d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"
        /><path d="M15 3v5h6" /><path d="M7 11h10" /><path d="M7 15h10" /></svg
      >
      <span class="text-sm tracking-tight">{i18n.t('nav.notes')}</span>
    </button>
  </div>

  <div class="h-px bg-slate-800/50 mb-6 mx-2"></div>

  <!-- Calendars Header -->
  <div class="flex items-center justify-between mb-4 px-3">
    <h2 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
      {i18n.t('nav.myCalendars')}
    </h2>
    <div class="flex items-center gap-2">
      <button
        class="text-slate-400 hover:text-gravex-primary-600 dark:hover:text-gravex-primary-400 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        onclick={() => (isCreating = !isCreating)}
        title="Add Calendar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-plus"
          ><path d="M5 12h14" /><path d="M12 5v14" /></svg
        >
      </button>
    </div>
  </div>

  <!-- Create Form -->
  {#if isCreating}
    <form
      onsubmit={handleCreate}
      class="mb-4 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50 animate-in slide-in-from-top-2 fade-in duration-200 mx-2"
    >
      <input
        type="text"
        bind:value={newCalendarName}
        placeholder={i18n.locale === 'kr' ? '캘린더 이름' : 'Calendar Name'}
        class="w-full text-sm font-medium bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-gravex-primary-500 outline-none pb-1 mb-3 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
        use:focusNode
      />

      <div class="flex flex-wrap gap-1.5 mb-3">
        {#each PRESET_COLORS as color}
          <button
            type="button"
            class="w-4 h-4 rounded-full transition-transform hover:scale-110 focus:ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-800 ring-slate-400 dark:ring-slate-700"
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
          class="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          {i18n.t('common.cancel')}
        </button>
        <button
          type="submit"
          class="text-[10px] uppercase font-bold text-gravex-primary-600 dark:text-gravex-primary-400 hover:text-gravex-primary-700 dark:hover:text-gravex-primary-300 transition-colors"
        >
          {i18n.t('common.save')}
        </button>
      </div>
    </form>
  {/if}

  <!-- List -->
  {#if query.isLoading}
    <div class="space-y-2 px-3">
      {#each { length: 3 } as _}
        <Skeleton class="h-6 w-full bg-slate-800" />
      {/each}
    </div>
  {:else if query.data}
    <div class="space-y-0.5 overflow-y-auto flex-1 px-2 custom-scrollbar">
      {#each query.data as cal (cal.id)}
        {#if editingId === cal.id}
          <!-- Edit Mode -->
          <div
            class="bg-white dark:bg-slate-800 p-2.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50 mb-1"
          >
            <form
              onsubmit={(e) => {
                e.preventDefault()
                saveEdit()
              }}
            >
              <input
                type="text"
                bind:value={editName}
                class="w-full text-sm font-medium bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-gravex-primary-500 outline-none pb-1 mb-2 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
                use:focusNode
                onkeydown={handleKeydown}
              />
              <div class="flex flex-wrap gap-1.5 mb-3">
                {#each PRESET_COLORS as color}
                  <button
                    type="button"
                    class="w-3.5 h-3.5 rounded-full transition-transform hover:scale-110 focus:ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-800 ring-slate-400 dark:ring-slate-700"
                    style="background-color: {color}; transform: {editColor ===
                    color
                      ? 'scale(1.2)'
                      : 'scale(1)'}"
                    onclick={() => (editColor = color)}
                    aria-label="Select color"
                  ></button>
                {/each}
              </div>
              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  class="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  onclick={() => (editingId = null)}
                  title="Cancel"
                >
                  {i18n.t('common.cancel')}
                </button>
                <button
                  type="submit"
                  class="text-[10px] uppercase font-bold text-gravex-primary-600 dark:text-gravex-primary-400 hover:text-gravex-primary-700 dark:hover:text-gravex-primary-300 transition-colors"
                  title="Save"
                >
                  {i18n.t('common.save')}
                </button>
              </div>
            </form>
          </div>
        {:else}
          <!-- View Mode -->
          <div
            class="group flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800/40 transition-all"
          >
            <label
              class="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
            >
              <div class="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  class="peer appearance-none w-3.5 h-3.5 rounded border border-slate-600 checked:border-transparent transition-all"
                  style="background-color: {visibleCalendarIds.includes(cal.id)
                    ? cal.color
                    : 'transparent'}; border-color: {visibleCalendarIds.includes(
                    cal.id
                  )
                    ? cal.color
                    : '#475569'}"
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

              <span
                class="text-sm font-medium text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 truncate h-5 leading-tight block transition-colors"
                >{cal.name}</span
              >
            </label>

            <!-- Actions -->
            <div
              class="flex items-center transition-all opacity-0 group-hover:opacity-100"
            >
              {#if cal.role === 'owner'}
                <button
                  class="text-slate-600 hover:text-white p-1"
                  onclick={(e) => {
                    e.stopPropagation()
                    startEdit(cal)
                  }}
                  title="Edit"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-pencil"
                    ><path
                      d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"
                    /><path d="m15 5 4 4" /></svg
                  >
                </button>
                {#if !cal.isPrimary}
                  <button
                    class="text-slate-600 hover:text-red-400 p-1"
                    onclick={(e) => {
                      e.stopPropagation()
                      handleDelete(cal.id, cal.name)
                    }}
                    title="Delete Calendar"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
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
              {/if}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}

  {@render children?.()}

  <!-- Footer Actions -->
  {#if !children}
    <div
      class="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1"
    >
      <div class="px-3 mb-2">
        <span
          class="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest"
          >{i18n.t('common.settings')}</span
        >
      </div>

      {#if activeTab === 'calendar'}
        <button
          onclick={onImport}
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-white dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
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
            class="lucide lucide-import opacity-70"
            ><path d="M12 3v12" /><path d="m8 11 4 4 4-4" /><path
              d="M8 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5h-3"
            /></svg
          >
          <span class="text-sm font-medium">{i18n.t('nav.import')}</span>
        </button>

        <button
          onclick={onExport}
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-white dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
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
            class="lucide lucide-download opacity-70"
            ><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline
              points="7 10 12 15 17 10"
            /><line x1="12" x2="12" y1="15" y2="3" /></svg
          >
          <span class="text-sm font-medium">{i18n.t('nav.export')}</span>
        </button>
      {/if}

      <div class="grid grid-cols-2 gap-2 mt-1">
        <button
          onclick={onLocaleChange}
          class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-white dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Switch Language"
        >
          <span class="text-base grayscale opacity-70"
            >{i18n.locale === 'kr' ? '🇰🇷' : '🇺🇸'}</span
          >
        </button>

        <button
          onclick={() => {
            const newTheme = settings.theme === 'dark' ? 'light' : 'dark'
            settings.theme = newTheme
            if (newTheme === 'dark') {
              document.documentElement.classList.add('dark')
            } else {
              document.documentElement.classList.remove('dark')
            }
          }}
          class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-white dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Theme"
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
            class="hidden dark:block"
            ><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path
              d="M12 20v2"
            /><path d="m4.93 4.93 1.41 1.41" /><path
              d="m17.66 17.66 1.41 1.41"
            /><path d="M2 12h2" /><path d="M20 12h2" /><path
              d="m6.34 17.66-1.41 1.41"
            /><path d="m19.07 4.93-1.41 1.41" /></svg
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
            class="block dark:hidden"
            ><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg
          >
        </button>
      </div>

      <button
        onclick={onSignOut}
        class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-50 dark:text-red-400/70 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors mt-2"
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
          class="lucide lucide-log-out"
          ><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline
            points="16 17 21 12 16 7"
          /><line x1="21" x2="9" y1="12" y2="12" /></svg
        >
        <span class="text-sm font-medium">{i18n.t('nav.signOut')}</span>
      </button>

      <button
        onclick={handleDeleteAccount}
        class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-50 dark:text-red-400/70 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors mt-1"
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
        <span class="text-sm font-medium">{i18n.t('nav.deleteAccount')}</span>
      </button>

      <div class="mt-4 px-2 text-center text-xs text-slate-700 font-medium">
        &copy; 2026 Gravex
      </div>
    </div>
  {/if}
</div>
