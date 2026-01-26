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
  import { metadata } from '$lib/metadata'

  let { data }: { data: PageData } = $props()

  let currentDate = $state(dayjs())
  let isReady = $state(false)
  let isSidebarOpen = $state(false)
  let features = $derived([
    {
      title: i18n.t('common_ui.features.speed'),
      desc: i18n.t('common_ui.features.speedDesc'),
      cardClass:
        'bg-white/80 backdrop-blur-md border border-indigo-50 shadow-sm hover:shadow-xl hover:bg-white dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10',
      iconClass:
        'text-yellow-600 bg-yellow-100/50 dark:text-yellow-400 dark:bg-yellow-400/10',
      path: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z'
    },
    {
      title: i18n.t('common_ui.features.ai'),
      desc: i18n.t('common_ui.features.aiDesc'),
      cardClass:
        'bg-white/80 backdrop-blur-md border border-indigo-50 shadow-sm hover:shadow-xl hover:bg-white dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10',
      iconClass:
        'text-purple-600 bg-purple-100/50 dark:text-purple-400 dark:bg-purple-400/10',
      path: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z'
    },
    {
      title: i18n.t('common_ui.features.place'),
      desc: i18n.t('common_ui.features.placeDesc'),
      cardClass:
        'bg-white/80 backdrop-blur-md border border-indigo-50 shadow-sm hover:shadow-xl hover:bg-white dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10',
      iconClass:
        'text-amber-700 bg-amber-100/50 dark:text-amber-400 dark:bg-amber-400/10',
      path: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z'
    },
    {
      title: i18n.t('common_ui.features.portability'),
      desc: i18n.t('common_ui.features.portabilityDesc'),
      cardClass:
        'bg-white/80 backdrop-blur-md border border-indigo-50 shadow-sm hover:shadow-xl hover:bg-white dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10',
      iconClass:
        'text-emerald-600 bg-emerald-100/50 dark:text-emerald-400 dark:bg-emerald-400/10',
      path: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5'
    },
    {
      title: i18n.t('common_ui.features.privacy'),
      desc: i18n.t('common_ui.features.privacyDesc'),
      cardClass:
        'bg-white/80 backdrop-blur-md border border-indigo-50 shadow-sm hover:shadow-xl hover:bg-white dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10',
      iconClass:
        'text-indigo-600 bg-indigo-100/50 dark:text-indigo-400 dark:bg-indigo-400/10',
      path: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z'
    }
  ])

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
    enabled: !!data.session,
    refetchOnWindowFocus: false
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
        toast.info(i18n.t('toast.allCalendarsHidden'), {
          position: 'bottom',
          duration: 3000
        })
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
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false
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

  const handleChatEventCreated = async (event: any) => {
    // 1. Refresh Data (Force a refetch for the current view)
    // We do this immediately so the background data is fresh
    await queryClient.invalidateQueries({ queryKey: ['events'] })

    // 2. Move to Date (This might trigger another fetch if the month changes, which is fine)
    if (event.startTime) {
      handleMoveToDate(event.startTime)
    }

    // 3. Open Modal
    handleEventClick(event)
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
    toast.success(i18n.t('toast.exportingEvents'), {
      position: 'top'
    })
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
          toast.info(i18n.t('toast.noEventsFound'), { position: 'top' })
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

<svelte:head>
  <title>Scheduly | Gravex.app</title>
  <meta name="description" content={metadata.description} />

  <!-- Open Graph / Social Media -->
  <meta property="og:title" content={metadata.title} />
  <meta property="og:description" content={metadata.description} />
  <meta property="og:image" content={metadata.image} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={metadata.url} />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={metadata.title} />
  <meta name="twitter:description" content={metadata.description} />
  <meta name="twitter:image" content={metadata.image} />
</svelte:head>

<main
  class="h-[100dvh] flex flex-col relative overflow-hidden bg-page selection:bg-gravex-primary-500/30"
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
            class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onclick={() => (isSidebarOpen = false)}
            aria-hidden="true"
          ></div>
          <div
            class="absolute inset-y-0 left-0 w-56 bg-page-sidebar shadow-2xl border-r border-border-base"
          >
            <Sidebar
              visibleCalendarIds={settings.visibleCalendarIds}
              onToggle={toggleCalendar}
              bind:activeTab={settings.lastActiveTab}
              onSignOut={confirmSignOut}
              onImport={handleImport}
              onExport={handleExport}
              onLocaleChange={() => i18n.toggleLocale()}
              onTabChange={() => (isSidebarOpen = false)}
              class="h-full border-none"
            />
          </div>
        </div>

        <!-- Desktop Sidebar -->
        <div class="hidden lg:block h-full w-56 shrink-0">
          <Sidebar
            visibleCalendarIds={settings.visibleCalendarIds}
            onToggle={toggleCalendar}
            bind:activeTab={settings.lastActiveTab}
            onSignOut={confirmSignOut}
            onImport={handleImport}
            onExport={handleExport}
            onLocaleChange={() => i18n.toggleLocale()}
            onTabChange={() => (isSidebarOpen = false)}
            class="bg-transparent border-none text-slate-400 w-56"
          />
        </div>
      {/if}

      <!-- Main Content Card -->
      <div class="flex-1 flex flex-col h-full overflow-hidden p-0 lg:p-4">
        <div
          class="flex-1 bg-surface rounded-none lg:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border-0 lg:border border-border-base"
        >
          <!-- Header -->
          <div
            class="px-4 md:px-6 lg:px-8 py-5 flex items-center justify-between bg-surface/80 backdrop-blur-sm sticky top-0 z-20"
          >
            <div class="flex items-center gap-4">
              <!-- Sidebar Toggle -->
              <button
                class="text-content-muted hover:text-content-primary hover:bg-surface-hover p-2 rounded-xl"
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
                class="text-2xl font-black tracking-tight flex items-center gap-3 text-gradient-brand"
              >
                {settings.lastActiveTab === 'calendar' ? 'Calendar' : 'Notes'}
              </h1>
            </div>
          </div>

          <!-- Content -->
          <div
            class="flex-1 overflow-hidden relative flex flex-col items-center bg-surface"
          >
            <div class="w-full h-full flex flex-col p-4 relative">
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
                  class="absolute inset-0 p-4 md:p-6 lg:p-8 bg-surface/50 z-10 flex flex-col pointer-events-none"
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
    <div
      class="h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-gradient-to-br from-indigo-50 to-white dark:from-slate-950 dark:to-slate-900 block"
    >
      <div
        class="min-h-full flex flex-col items-center justify-start md:justify-center px-6 py-24 md:p-6 relative"
      >
        <!-- Background decorations -->
        <div
          class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30 dark:opacity-20"
        >
          <div
            class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/50 dark:bg-indigo-900/30 rounded-full blur-3xl"
          ></div>
          <div
            class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/50 dark:bg-purple-900/30 rounded-full blur-3xl"
          ></div>
        </div>

        <div
          class="max-w-4xl w-full z-10 flex flex-col items-center text-center gap-10"
        >
          <!-- Hero Text -->
          <div class="space-y-6">
            <div class="space-y-4 flex flex-col items-center">
              <!-- Title with Logo -->
              <div class="flex items-center gap-4 md:gap-6">
                <img
                  src="/favicon_transparent.png"
                  alt="Scheduly Logo"
                  class="w-16 h-16 md:w-20 md:h-20 drop-shadow-lg transform transition-transform duration-300 hover:scale-110"
                />
                <h1
                  class="text-5xl md:text-7xl font-extrabold tracking-tight text-gradient-brand"
                >
                  Scheduly
                </h1>
              </div>

              <!-- Tagline -->
              <p
                class="text-lg md:text-xl text-content-primary font-normal tracking-normal"
                style="font-family: 'Manrope', sans-serif;"
              >
                Lightning fast calendar & notes, powered by AI
              </p>
            </div>
          </div>

          <!-- Selling Points Grid -->
          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 w-full text-left"
          >
            {#each features as feature}
              <div
                class="p-6 rounded-2xl border shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 {feature.cardClass}"
              >
                <div
                  class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 {feature.iconClass}"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-6 h-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d={feature.path}
                    />
                  </svg>
                </div>
                <h3 class="font-bold text-lg text-content-primary mb-2">
                  {feature.title}
                </h3>
                <p class="text-content-secondary text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            {/each}
          </div>

          <!-- CTA Button -->
          <div class="flex flex-col items-center gap-8 w-full">
            <button
              onclick={openLoginPopup}
              class="flex items-center gap-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#3c1e1e] px-10 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 border border-[#FDD835]/50 group text-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="transition-transform group-hover:scale-110"
                ><path
                  d="M12 3c5.523 0 10 3.582 10 8 0 4.42-4.48 8-10 8-1.077 0-2.11-.135-3.077-.387-.232-.06-.476-.048-.7.034l-3.328 2.22c-.52.347-1.18-.178-.962-.764l.608-2.37c.07-.27-.008-.553-.207-.753C2.863 15.395 2 13.784 2 11c0-4.418 4.477-8 10-8z"
                /></svg
              >
              <span>{i18n.t('common_ui.kakaoStart')}</span>
            </button>

            <span class="text-sm text-content-muted font-medium tracking-wide">
              &copy; 2026 Gravex.app
            </span>
          </div>
        </div>
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
    <ChatBot
      onMoveToDate={handleMoveToDate}
      onEventCreated={handleChatEventCreated}
    />
  {/if}
</main>
