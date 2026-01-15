<script lang="ts">
  import CalendarGrid from '$lib/components/CalendarGrid.svelte'
  import Sidebar from '$lib/components/Sidebar.svelte'
  import { i18n } from '$lib/i18n.svelte.js'
  import { toast } from '$lib/toast.svelte.js'
  import { modal } from '$lib/modal.svelte.js'
  import ModalEvent from '$lib/components/modals/ModalEvent.svelte'
  import ModalLocale from '$lib/components/modals/ModalLocale.svelte'
  import ModalConfirm from '$lib/components/modals/ModalConfirm.svelte'
  import ModalImportCalendar from '$lib/components/modals/ModalImportCalendar.svelte'
  import ChatBot from '$lib/components/ChatBot.svelte'
  import CalendarSkeleton from '$lib/components/CalendarSkeleton.svelte'
  import NotesView from '$lib/components/note/NotesView.svelte'
  import dayjs from 'dayjs'
  import {
    createQuery,
    useQueryClient,
    keepPreviousData
  } from '@tanstack/svelte-query'
  import { signIn, signOut } from '@auth/sveltekit/client'
  import { untrack } from 'svelte'
  import type { PageData } from './$types'
  import { logger } from '$lib/logger'

  let { data }: { data: PageData } = $props()

  let activeTab = $state('calendar') // 'calendar' | 'notes'
  let currentDate = $state(dayjs())
  let isReady = $state(false)
  let visibleCalendarIds = $state<string[]>([])
  let showMobileSidebar = $state(false)

  function handleMoveToDate(dateStr: string) {
    activeTab = 'calendar'
    currentDate = dayjs(dateStr)
  }

  // Persist tab selection and calendar visibility
  $effect(() => {
    const savedTab = localStorage.getItem('last_active_tab')
    if (savedTab && (savedTab === 'calendar' || savedTab === 'notes')) {
      untrack(() => (activeTab = savedTab))
    }

    const savedCalendars = localStorage.getItem('visible_calendars')
    if (savedCalendars) {
      try {
        const parsed = JSON.parse(savedCalendars)
        if (Array.isArray(parsed)) {
          untrack(() => (visibleCalendarIds = parsed))
        }
      } catch (e) {
        logger.error('Failed to parse visible calendars', { error: e })
      }
    }
    isReady = true
  })

  $effect(() => {
    localStorage.setItem('last_active_tab', activeTab)
  })

  $effect(() => {
    if (visibleCalendarIds.length > 0) {
      localStorage.setItem(
        'visible_calendars',
        JSON.stringify(visibleCalendarIds)
      )
    }
  })

  const queryClient = useQueryClient()

  // TanStack Query for calendars
  const calendarsQuery = createQuery(() => ({
    queryKey: ['calendars'],
    queryFn: async () => {
      const res = await fetch('/api/calendars')
      if (!res.ok) throw new Error('Failed to fetch calendars')
      return res.json()
    },
    enabled: !!data.session
  }))

  // Auto-select all calendars if empty state (first load)
  $effect(() => {
    if (calendarsQuery.data && visibleCalendarIds.length === 0 && isReady) {
      const primary = calendarsQuery.data.find((c: any) => c.isPrimary)
      if (primary) {
        visibleCalendarIds = [primary.id]
      } else {
        // Fallback: Select all calendars
        visibleCalendarIds = calendarsQuery.data.map((c: any) => c.id)
      }
    }
  })

  function toggleCalendar(id: string, visible: boolean) {
    if (visible) {
      visibleCalendarIds = [...visibleCalendarIds, id]
    } else {
      visibleCalendarIds = visibleCalendarIds.filter((cid) => cid !== id)
    }
  }

  // Calculate fetch range based on current view (start of month - buffer, end of month + buffer)
  const fetchRange = $derived({
    start: currentDate.startOf('month').subtract(2, 'week').toISOString(),
    end: currentDate.endOf('month').add(2, 'week').toISOString()
  })

  // TanStack Query for events - Svelte 5 requires a functional options getter
  const query = createQuery(() => ({
    queryKey: ['events', fetchRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        start: fetchRange.start,
        end: fetchRange.end
      })
      const res = await fetch(`/api/events?${params}`)
      if (!res.ok) throw new Error('Failed to fetch events')
      return res.json()
    },
    enabled: !!data.session && activeTab === 'calendar' && isReady,
    placeholderData: keepPreviousData
  }))

  async function handleDateClick(date: any) {
    if (!data.session) {
      openLoginPopup()
      return
    }

    const result = await modal.show(
      ModalEvent,
      { selectedDate: date },
      { preventCloseOnClickBackdrop: true }
    )
    if (result?.success) {
      // Refresh events to ensure all instances (recurring, moved calendars) are up to date
      queryClient.invalidateQueries({ queryKey: ['events'] })
    }
  }

  async function handleEventClick(event: any) {
    if (!data.session) return

    const result = await modal.show(
      ModalEvent,
      { event },
      { preventCloseOnClickBackdrop: true }
    )
    if (result?.success) {
      // Refresh events to ensure all instances (recurring, moved calendars) are up to date
      queryClient.invalidateQueries({ queryKey: ['events'] })
    }
  }

  async function openLoginPopup() {
    // Calculate center position
    const width = 500
    const height = 600
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    // 1. Open blank popup immediately to avoid blocker
    const popup = window.open(
      '',
      'kakao_login',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
    )

    if (!popup) {
      alert('Please allow popups for this site')
      return
    }

    // @ts-ignore
    popup.document.write('Loading login...')

    try {
      // 2. Get the auth URL via signIn (POST)
      const response = await signIn('kakao', {
        redirect: false,
        callbackUrl: window.location.origin + '/auth-callback'
      })

      // 3. Set popup location
      // @ts-ignore
      if (response?.url) {
        // @ts-ignore
        popup.location.href = response.url
      } else {
        popup.close()
        logger.error('Failed to get auth URL', { response })
      }
    } catch (e) {
      popup.close()
      logger.error('Login Popup Error', { error: e })
    }

    // 4. Poll for closure
    if (popup) {
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer)
          // Refresh page to check session
          window.location.reload()
        }
      }, 500)
    }
  }

  async function handleExport() {
    window.location.href = '/api/events/export'
    showMobileSidebar = false
    toast.success(
      i18n.locale === 'kr' ? '일정을 내보냅니다' : 'Exporting events...',
      {
        position: 'top'
      }
    )
  }

  let fileInput = $state<HTMLInputElement>()

  async function handleImport() {
    fileInput?.click()
  }

  async function onFileSelected(
    e: Event & { currentTarget: EventTarget & HTMLInputElement }
  ) {
    const target = e.currentTarget
    if (!target.files?.[0]) return

    const formData = new FormData()
    formData.append('file', target.files[0])

    try {
      // 1. Get Preview
      const res = await fetch('/api/events/import', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const result = await res.json()

        if (result.preview && result.events?.length > 0) {
          showMobileSidebar = false
          // 2. Show Selection Modal
          const modalResult = await modal.show(
            ModalImportCalendar,
            { events: result.events },
            { preventCloseOnClickBackdrop: true }
          )

          // 3. Import Selected
          if (modalResult?.success && modalResult.selectedEvents?.length > 0) {
            const importRes = await fetch('/api/events/import', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ events: modalResult.selectedEvents })
            })

            if (importRes.ok) {
              const importResult = await importRes.json()
              toast.success(
                i18n.t('toast.importSuccess', { count: importResult.count }),
                {
                  position: 'top'
                }
              )
              queryClient.invalidateQueries({ queryKey: ['events'] })
            } else {
              throw new Error('Import failed')
            }
          }
        } else {
          toast.info(
            i18n.locale === 'kr'
              ? '가져올 일정이 없습니다.'
              : 'No events found.',
            { position: 'top' }
          )
        }
      } else {
        toast.error(i18n.t('toast.importError'), { position: 'top' })
      }
    } catch (err) {
      logger.error('Import process failed', { error: err })
      toast.error(i18n.t('toast.importError'), { position: 'top' })
    } finally {
      target.value = ''
    }
  }

  async function handleOpenLocale() {
    await modal.show(ModalLocale)
  }

  async function confirmSignOut() {
    const confirmed = await modal.show(ModalConfirm, {
      title: i18n.t('nav.signOut'),
      message: i18n.t('nav.signOutConfirm'),
      confirmText: i18n.t('nav.signOut'),
      confirmClass: 'bg-slate-800 hover:bg-slate-900 text-white'
    })

    if (confirmed) {
      signOut()
    }
  }
</script>

<svelte:head>
  <title>Justodo | {i18n.t('nav.calendar')} & {i18n.t('nav.notes')}</title>
  <meta
    name="description"
    content="Justodo is a clean, minimal planner that combines a powerful calendar with smart note-taking. Sync your schedule and manage your tasks with ease."
  />

  <!-- Open Graph / Social Media -->
  <meta property="og:title" content="Justodo | Simple Calendar & Smart Notes" />
  <meta
    property="og:description"
    content="A minimal, high-performance planner for managing your schedule and notes in one place."
  />
  <meta property="og:image" content="/logo.png" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://justodo.gravex.app" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Justodo | Simple Planner" />
  <meta
    name="twitter:description"
    content="The minimal calendar and notes app you've been looking for."
  />
  <meta name="twitter:image" content="/logo.png" />
</svelte:head>

<main class="h-screen flex flex-col relative overflow-hidden">
  {#if data.session}
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar -->
      <div class="hidden md:block h-full">
        <Sidebar
          {visibleCalendarIds}
          onToggle={toggleCalendar}
          bind:activeTab
          onSignOut={confirmSignOut}
          onImport={handleImport}
          onExport={handleExport}
          onLocaleChange={() => {
            const next = i18n.locale === 'kr' ? 'en' : 'kr'
            i18n.setLocale(next)
          }}
        />
      </div>

      <div class="flex-1 flex flex-col h-full overflow-hidden bg-white">
        <div
          class="px-4 sm:px-6 lg:px-8 py-6 pb-0 flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <!-- Mobile Menu Toggle -->
            <button
              class="md:hidden text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
              onclick={() => (showMobileSidebar = true)}
              aria-label="Open Menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1
              class="text-3xl font-black tracking-tight flex items-center gap-3"
            >
              <span class="text-justodo-green-600">Justodo</span>
            </h1>
          </div>
        </div>

        <!-- Mobile Sidebar Drawer -->
        {#if showMobileSidebar}
          <div class="fixed inset-0 z-[150] md:hidden">
            <!-- Backdrop -->
            <div
              class="absolute inset-0 bg-black/20 backdrop-blur-sm"
              role="presentation"
              onclick={() => (showMobileSidebar = false)}
            ></div>
            <!-- Drawer -->
            <div
              class="absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col"
            >
              <!-- Drawer Header -->
              <div
                class="flex items-center justify-between p-4 border-b border-slate-100 shrink-0"
              >
                <span class="font-black text-xl text-justodo-green-600"
                  >Justodo</span
                >
                <button
                  onclick={() => (showMobileSidebar = false)}
                  class="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                  aria-label="Close menu"
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
                    class="lucide lucide-x"
                    ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
                  >
                </button>
              </div>

              <div class="flex-1 overflow-hidden">
                <Sidebar
                  {visibleCalendarIds}
                  onToggle={toggleCalendar}
                  bind:activeTab
                  class="w-full h-full border-none bg-white p-4"
                  onSignOut={confirmSignOut}
                  onImport={handleImport}
                  onExport={handleExport}
                  onLocaleChange={() => {
                    const next = i18n.locale === 'kr' ? 'en' : 'kr'
                    i18n.setLocale(next)
                  }}
                  onTabChange={() => (showMobileSidebar = false)}
                />
              </div>
            </div>
          </div>
        {/if}

        <div
          class="flex-1 overflow-hidden relative flex flex-col items-center bg-slate-50/30"
        >
          <div class="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 relative">
            {#if query.isError}
              <div
                class="h-full flex flex-col items-center justify-center bg-red-50 rounded border border-red-100 shadow-sm"
              >
                <p class="text-red-500 font-bold mb-2">Failed to load events</p>
                <button
                  onclick={() => query.refetch()}
                  class="text-red-600 underline">Try again</button
                >
              </div>
            {:else if !query.data && query.isLoading}
              <CalendarSkeleton />
            {:else if activeTab === 'calendar'}
              <CalendarGrid
                bind:currentDate
                events={query.data || []}
                calendars={calendarsQuery.data || []}
                {visibleCalendarIds}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
              />

              <!-- Loading Overlay -->
              <div
                class="absolute inset-0 p-4 sm:p-6 lg:p-8 bg-white/50 z-10 transition-opacity duration-300 delay-100 flex flex-col pointer-events-none"
                class:opacity-0={!query.isFetching}
                class:opacity-100={query.isFetching}
                class:pointer-events-auto={query.isFetching}
              >
                <CalendarSkeleton />
              </div>
            {:else}
              <div class="h-full overflow-y-auto w-full">
                <NotesView />
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="relative h-screen">
      <div
        class="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded border border-slate-100"
      >
        <p class="text-xl font-bold text-slate-400 mb-6">
          {i18n.t('common_ui.onboarding')}
        </p>
        <button
          onclick={openLoginPopup}
          class="flex items-center gap-2 bg-[#FEE500] hover:bg-[#FDD835] text-[#3c1e1e] px-8 py-4 rounded font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 border border-[#FDD835]/50 group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="transition-transform group-hover:scale-110"
            ><path
              d="M12 3c5.523 0 10 3.582 10 8 0 4.42-4.48 8-10 8-1.077 0-2.11-.135-3.077-.387-.232-.06-.476-.048-.7.034l-3.328 2.22c-.52.347-1.18-.178-.962-.764l.608-2.37c.07-.27-.008-.553-.207-.753C2.863 15.395 2 13.784 2 11c0-4.418 4.477-8 10-8z"
            /></svg
          >
          <span class="text-lg">{i18n.t('common_ui.kakaoStart')}</span>
        </button>
      </div>
      <!-- Blurred preview -->
      <div class="filter blur-sm pointer-events-none opacity-50 select-none">
        <CalendarGrid
          bind:currentDate
          events={[]}
          onDateClick={() => {}}
          onEventClick={() => {}}
        />
      </div>
    </div>
  {/if}

  {#if data.session}
    <input
      type="file"
      class="hidden"
      accept=".ics"
      bind:this={fileInput}
      onchange={onFileSelected}
    />
    <ChatBot onMoveToDate={handleMoveToDate} />
  {/if}
</main>
