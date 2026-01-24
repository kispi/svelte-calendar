<script lang="ts">
  import CalendarGrid from '$lib/components/CalendarGrid.svelte'
  import Sidebar from '$lib/components/Sidebar.svelte'
  import { i18n } from '$lib/i18n.svelte.js'
  import { settings } from '$lib/store/settings.svelte.js'
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
  import type { PageData } from './$types'
  import { logger } from '$lib/logger'

  let { data }: { data: PageData } = $props()

  let currentDate = $state(dayjs())
  let isReady = $state(false)
  let isSidebarOpen = $state(false)

  $effect(() => {
    isSidebarOpen = window.innerWidth >= 1024
    // Small delay to ensure client-side hydration for settings
    setTimeout(() => {
      isReady = true
    }, 0)
  })

  const handleMoveToDate = (dateStr: string) => {
    settings.lastActiveTab = 'calendar'
    currentDate = dayjs(dateStr)
  }

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
  let hasInitializedVisibility = $state(false)

  // Auto-select all calendars if empty state or cleanup invalid IDs
  $effect(() => {
    if (calendarsQuery.data && isReady) {
      const allIds = calendarsQuery.data.map((c: any) => c.id)

      // Filter out IDs that don't exist anymore
      const validIds = settings.visibleCalendarIds.filter((id) =>
        allIds.includes(id)
      )

      if (!hasInitializedVisibility) {
        // First load: If empty, default to primary or all
        if (validIds.length === 0) {
          const primary = calendarsQuery.data.find((c: any) => c.isPrimary)
          settings.visibleCalendarIds = primary ? [primary.id] : allIds
        } else if (validIds.length !== settings.visibleCalendarIds.length) {
          settings.visibleCalendarIds = validIds
        }
        hasInitializedVisibility = true
      } else {
        // Subsequent updates: Just cleanup invalid IDs, but DO NOT force select if empty
        if (validIds.length !== settings.visibleCalendarIds.length) {
          settings.visibleCalendarIds = validIds
        }
      }
    }
  })

  const toggleCalendar = (id: string, visible: boolean) => {
    if (visible) {
      settings.visibleCalendarIds = [...settings.visibleCalendarIds, id]
    } else {
      const nextIds = settings.visibleCalendarIds.filter(
        (cid: string) => cid !== id
      )
      settings.visibleCalendarIds = nextIds

      if (nextIds.length === 0) {
        toast.info(
          i18n.locale === 'kr'
            ? '모든 캘린더를 해제하면 아무 일정도 보이지 않습니다 😢'
            : 'No events will be visible if all calendars are unchecked 😢',
          { position: 'bottom', duration: 3000 }
        )
      }
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
    enabled: !!data.session && settings.lastActiveTab === 'calendar' && isReady,
    placeholderData: keepPreviousData
  }))

  const handleDateClick = async (date: any) => {
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

  const handleEventClick = async (event: any) => {
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

  const openLoginPopup = async () => {
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

  const handleExport = async () => {
    window.location.href = '/api/events/export'
    if (window.innerWidth < 1024) isSidebarOpen = false
    toast.success(
      i18n.locale === 'kr' ? '일정을 내보냅니다' : 'Exporting events...',
      {
        position: 'top'
      }
    )
  }

  let fileInput = $state<HTMLInputElement>()

  const handleImport = async () => {
    fileInput?.click()
  }

  const onFileSelected = async (
    e: Event & { currentTarget: EventTarget & HTMLInputElement }
  ) => {
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
          if (window.innerWidth < 1024) isSidebarOpen = false
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

  const confirmSignOut = async () => {
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

<svelte:window
  onfocus={() => {
    queryClient.invalidateQueries({ queryKey: ['events'] })
  }}
/>

<svelte:head>
  <title>
    {settings.lastActiveTab === 'calendar' ? 'Calendar' : 'Notes'} | Gravex.app
  </title>
  <meta name="description" content="Enjoy lightning fast calendar and notes." />

  <!-- Open Graph / Social Media -->
  <meta property="og:title" content="Calendar & Notes | Gravex.app" />
  <meta
    property="og:description"
    content="Enjoy lightning fast calendar and notes."
  />
  <meta property="og:image" content="/logo.png" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://gravex.app" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Calendar & Notes | Gravex.app" />
  <meta
    name="twitter:description"
    content="Enjoy lightning fast calendar and notes."
  />
  <meta name="twitter:image" content="/logo.png" />
</svelte:head>

<main
  class="h-screen flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300 selection:bg-gravex-primary-500/30"
>
  {#if data.session}
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar -->
      {#if isSidebarOpen}
        <!-- Mobile Drawer -->
        <div
          class="fixed inset-0 z-[100] lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onclick={() => (isSidebarOpen = false)}
            aria-hidden="true"
          ></div>
          <div
            class="absolute inset-y-0 left-0 w-72 bg-white dark:bg-slate-950 shadow-2xl transition-transform duration-300"
          >
            <Sidebar
              visibleCalendarIds={settings.visibleCalendarIds}
              onToggle={toggleCalendar}
              bind:activeTab={settings.lastActiveTab}
              onSignOut={confirmSignOut}
              onImport={handleImport}
              onExport={handleExport}
              onLocaleChange={() => {
                const next = i18n.locale === 'kr' ? 'en' : 'kr'
                i18n.setLocale(next)
              }}
              class="h-full border-none"
            />
          </div>
        </div>

        <!-- Desktop Sidebar -->
        <div
          class="hidden lg:block h-full transition-all duration-300 ease-in-out"
        >
          <Sidebar
            visibleCalendarIds={settings.visibleCalendarIds}
            onToggle={toggleCalendar}
            bind:activeTab={settings.lastActiveTab}
            onSignOut={confirmSignOut}
            onImport={handleImport}
            onExport={handleExport}
            onLocaleChange={() => {
              const next = i18n.locale === 'kr' ? 'en' : 'kr'
              i18n.setLocale(next)
            }}
            class="bg-transparent border-none text-slate-400 w-72"
          />
        </div>
      {/if}

      <!-- Main Content Card -->
      <div
        class="flex-1 flex flex-col h-full overflow-hidden p-0 lg:p-4 transition-all duration-300"
      >
        <div
          class="flex-1 bg-white dark:bg-slate-900 rounded-none lg:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border-0 lg:border border-slate-200/50 dark:border-slate-800 transition-colors duration-300"
        >
          <!-- Header -->
          <div
            class="px-4 md:px-6 lg:px-8 py-5 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-20 transition-colors duration-300"
          >
            <div class="flex items-center gap-4">
              <!-- Sidebar Toggle -->
              <button
                class="text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-xl transition-all"
                onclick={() => (isSidebarOpen = !isSidebarOpen)}
                aria-label="Toggle Sidebar"
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
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <path d="M9 3v18" />
                </svg>
              </button>
              <h1
                class="text-2xl font-black tracking-tight flex items-center gap-3 text-slate-900 dark:text-white transition-colors"
              >
                {settings.lastActiveTab === 'calendar' ? 'Calendar' : 'Notes'}
              </h1>
            </div>
          </div>

          <!-- Content -->
          <div
            class="flex-1 overflow-hidden relative flex flex-col items-center bg-white dark:bg-slate-900 transition-colors duration-300"
          >
            <div class="w-full h-full flex flex-col p-0 md:p-2 lg:p-4 relative">
              {#if query.isError}
                <div
                  class="h-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/50 shadow-sm m-4"
                >
                  <p class="text-red-500 dark:text-red-400 font-bold mb-2">
                    Failed to load events
                  </p>
                  <button onclick={() => query.refetch()} class="btn-danger"
                    >Try again</button
                  >
                </div>
              {:else if !query.data && query.isLoading}
                <div class="p-4"><CalendarSkeleton /></div>
              {:else if settings.lastActiveTab === 'calendar'}
                <CalendarGrid
                  bind:currentDate
                  events={query.data || []}
                  calendars={calendarsQuery.data || []}
                  visibleCalendarIds={settings.visibleCalendarIds}
                  onDateClick={handleDateClick}
                  onEventClick={handleEventClick}
                />

                <!-- Loading Overlay -->
                <div
                  class="absolute inset-0 p-4 md:p-6 lg:p-8 bg-white/50 dark:bg-slate-900/50 z-10 transition-opacity duration-300 delay-100 flex flex-col pointer-events-none"
                  class:opacity-0={!query.isFetching}
                  class:opacity-100={query.isFetching}
                >
                  <CalendarSkeleton />
                </div>
              {:else}
                <div class="h-full overflow-y-auto w-full px-4">
                  <NotesView initialNoteId={settings.lastNoteId} />
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="relative h-screen">
      <div
        class="absolute inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded border border-slate-100 dark:border-slate-800"
      >
        <p class="text-xl font-bold text-slate-900 dark:text-white mb-6">
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
