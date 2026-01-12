<script>
  import CalendarGrid from '$lib/components/CalendarGrid.svelte'
  import { modal } from '$lib/modal.svelte.js'
  import { toast } from '$lib/toast.svelte.js'
  import EventModal from '$lib/components/EventModal.svelte'
  import ConfirmModal from '$lib/components/ConfirmModal.svelte'
  import ChatBot from '$lib/components/ChatBot.svelte'
  import NotesView from '$lib/components/NotesView.svelte' // This import was not in the provided snippet, but was in the original code. Keeping it.
  import dayjs from 'dayjs'
  import { createQuery, useQueryClient } from '@tanstack/svelte-query'
  import { signIn, signOut } from '@auth/sveltekit/client'
  import { untrack } from 'svelte'

  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props()

  let activeTab = $state('calendar') // 'calendar' | 'notes'
  let currentDate = $state(dayjs())

  /** @param {string} dateStr */
  function handleMoveToDate(dateStr) {
    activeTab = 'calendar'
    currentDate = dayjs(dateStr)
  }

  // Persist tab selection
  $effect(() => {
    const saved = localStorage.getItem('last_active_tab')
    if (saved && (saved === 'calendar' || saved === 'notes')) {
      untrack(() => (activeTab = saved))
    }
  })

  $effect(() => {
    localStorage.setItem('last_active_tab', activeTab)
  })

  const queryClient = useQueryClient()

  // TanStack Query for events - Svelte 5 requires a functional options getter
  const query = createQuery(() => ({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await fetch('/api/events')
      if (!res.ok) throw new Error('Failed to fetch events')
      return res.json()
    },
    enabled: !!data.session
  }))

  /** @param {any} date */
  async function handleDateClick(date) {
    if (!data.session) {
      openLoginPopup()
      return
    }

    const result = await modal.show(
      EventModal,
      { selectedDate: date },
      { preventCloseOnClickBackdrop: true }
    )
    if (result?.success) {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    }
  }

  /** @param {any} event */
  async function handleEventClick(event) {
    if (!data.session) return

    const result = await modal.show(
      EventModal,
      { event },
      { preventCloseOnClickBackdrop: true }
    )
    if (result?.success) {
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
        console.error('Failed to get auth URL', response)
      }
    } catch (e) {
      popup.close()
      console.error(e)
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
    const events = query.data || []
    if (events.length === 0) {
      toast.info('No events to export')
      return
    }

    window.location.href = '/api/events/export'
    toast.success(`Successfully exported ${events.length} events!`, {
      position: 'top'
    })
  }

  let fileInput = $state()

  async function handleImport() {
    fileInput?.click()
  }

  /** @param {Event} e */
  async function onFileSelected(e) {
    const target = /** @type {HTMLInputElement} */ (e.target)
    if (!target.files?.[0]) return

    const formData = new FormData()
    formData.append('file', target.files[0])

    try {
      const res = await fetch('/api/events/import', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        const result = await res.json()
        alert(result.message)
        queryClient.invalidateQueries({ queryKey: ['events'] })
      } else {
        alert('Failed to import events')
      }
    } catch (err) {
      console.error(err)
      alert('Error importing events')
    } finally {
      target.value = ''
    }
  }

  async function confirmSignOut() {
    const confirmed = await modal.show(ConfirmModal, {
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      confirmText: 'Sign Out',
      confirmClass: 'bg-slate-800 hover:bg-slate-900 text-white'
    })

    if (confirmed) {
      signOut()
    }
  }
</script>

<svelte:head>
  <title>Justodo | Simple Calendar & Smart Notes</title>
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
  <meta property="og:url" content="https://justodo.vibrew.ai" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Justodo | Simple Planner" />
  <meta
    name="twitter:description"
    content="The minimal calendar and notes app you've been looking for."
  />
  <meta name="twitter:image" content="/logo.png" />
</svelte:head>

<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
  <div
    class="mb-10 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-6"
  >
    <div class="flex flex-col gap-1 items-center sm:items-start">
      <div class="flex items-center gap-3">
        <h1 class="text-3xl font-black tracking-tight">
          <span class="text-justodo-green-600">Justodo</span>
          <span class="text-slate-400 font-light">Planner</span>
        </h1>
      </div>

      {#if data.session}
        <div class="flex items-center gap-3 mt-1 sm:ml-11">
          <input
            type="file"
            accept=".ics"
            bind:this={fileInput}
            onchange={onFileSelected}
            class="hidden"
          />
          <button
            onclick={handleImport}
            class="text-[10px] font-bold text-slate-400 hover:text-justodo-green-600 transition-colors uppercase tracking-widest"
          >
            Import
          </button>
          <span class="text-[10px] text-slate-200">|</span>
          <button
            onclick={handleExport}
            class="text-[10px] font-bold text-slate-400 hover:text-justodo-green-600 transition-colors uppercase tracking-widest"
          >
            Export
          </button>
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-4">
      {#if data.session}
        <div class="flex items-center gap-2">
          <div
            class="flex items-center gap-3 bg-transparent p-1 px-2 rounded transition-all"
          >
            {#if data.session.user?.image}
              <img
                src={data.session.user.image}
                alt="User"
                class="w-8 h-8 rounded-sm grayscale hover:grayscale-0 transition-all border border-slate-100"
              />
            {/if}
            <div class="text-left hidden sm:block">
              <p
                class="text-[11px] font-black text-slate-800 leading-none uppercase tracking-tighter"
              >
                {data.session.user?.name}
              </p>
            </div>
          </div>
        </div>
      {:else}
        <button
          onclick={openLoginPopup}
          class="flex items-center gap-2 bg-[#FEE500] hover:bg-[#FDD835] text-[#3c1e1e] px-5 py-2.5 rounded font-bold transition-all shadow-sm hover:shadow-md active:scale-95 border border-[#FDD835]/50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            ><path
              d="M12 3c-5.5 0-10 3.6-10 8 0 2.5 1.5 4.8 4 6.2-.2.8-.7 2.8-.8 3.2 0 .1 0 .2.2.2.1 0 .2 0 .3-.1 3.5-2.6 4-3 4.4-3.2.6.1 1.3.2 1.9.2 5.5 0 10-3.6 10-8s-4.5-8-10-8z"
            /></svg
          >
          Login with Kakao
        </button>
      {/if}
    </div>
  </div>

  {#if data.session}
    {#if query.isLoading}
      <div
        class="h-[600px] flex items-center justify-center bg-white rounded border border-slate-100 shadow-sm animate-pulse"
      >
        <p class="text-slate-400 font-medium">Loading your schedule...</p>
      </div>
    {:else if query.isError}
      <div
        class="h-[600px] flex flex-col items-center justify-center bg-red-50 rounded border border-red-100 shadow-sm"
      >
        <p class="text-red-500 font-bold mb-2">Failed to load events</p>
        <button onclick={() => query.refetch()} class="text-red-600 underline"
          >Try again</button
        >
      </div>
    {:else}
      {#if activeTab === 'calendar'}
        <CalendarGrid
          bind:currentDate
          events={query.data || []}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
        />
      {:else}
        <NotesView />
      {/if}

      <!-- Bottom Navigation Dock -->
      <div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
        <div
          class="bg-white/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex items-center gap-1"
        >
          <button
            onclick={() => (activeTab = 'calendar')}
            class="flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all duration-300
                   {activeTab === 'calendar'
              ? 'bg-slate-900 text-white shadow-lg scale-105'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-calendar-days"
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
              /><path d="M8 14h.01" /><path d="M12 14h.01" /><path
                d="M16 14h.01"
              /><path d="M8 18h.01" /><path d="M12 18h.01" /><path
                d="M16 18h.01"
              /></svg
            >
            <span class="text-[10px] font-black uppercase tracking-tighter"
              >Calendar</span
            >
          </button>

          <button
            onclick={() => (activeTab = 'notes')}
            class="flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all duration-300
                   {activeTab === 'notes'
              ? 'bg-slate-900 text-white shadow-lg scale-105'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-sticky-note"
              ><path
                d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"
              /><path d="M15 3v5h6" /><path d="M7 11h10" /><path
                d="M7 15h10"
              /></svg
            >
            <span class="text-[10px] font-black uppercase tracking-tighter"
              >Notes</span
            >
          </button>
        </div>
      </div>

      <!-- Sign Out Action (In-flow) -->
      <div class="mt-8 mb-8 flex justify-end">
        <button
          onclick={confirmSignOut}
          class="text-[10px] font-black text-slate-300 hover:text-red-400 transition-all uppercase tracking-[0.3em] flex items-center gap-2 group px-4 py-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-log-out group-hover:translate-x-1 transition-transform"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Sign Out
        </button>
      </div>
    {/if}
  {:else}
    <div class="relative">
      <div
        class="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded border border-slate-100"
      >
        <p class="text-xl font-bold text-slate-400 mb-6">
          Please login to manage your schedule
        </p>
        <button
          onclick={openLoginPopup}
          class="bg-slate-800 hover:bg-slate-900 text-white px-10 py-3.5 rounded font-bold shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5"
        >
          Get Started
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
    <ChatBot onMoveToDate={handleMoveToDate} />
  {/if}
</main>
