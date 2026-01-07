<script>
  import CalendarGrid from '$lib/components/CalendarGrid.svelte'
  import EventModal from '$lib/components/EventModal.svelte'
  import { createQuery, useQueryClient } from '@tanstack/svelte-query'
  import { modal } from '$lib/modal.svelte.js'
  import { signIn, signOut } from '@auth/sveltekit/client'

  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props()

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

    const result = await modal.show(EventModal, { selectedDate: date })
    if (result?.success) {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    }
  }

  /** @param {any} event */
  async function handleEventClick(event) {
    if (!data.session) return

    const result = await modal.show(EventModal, { event })
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
</script>

<svelte:head>
  <title>Antigravity Calendar</title>
</svelte:head>

<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
  <div
    class="mb-8 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-4"
  >
    <div>
      <h1 class="text-4xl font-extrabold text-slate-800 tracking-tight">
        Antigravity <span class="text-maple-orange-500">Scheduler</span>
      </h1>
      <p class="mt-2 text-slate-500 text-lg">
        Manage your schedule with zero gravity.
      </p>
    </div>

    <div>
      {#if data.session}
        <div
          class="flex items-center gap-4 bg-white p-2 pr-4 rounded-full shadow-sm border border-slate-100"
        >
          {#if data.session.user?.image}
            <img
              src={data.session.user.image}
              alt="User"
              class="w-10 h-10 rounded-full border border-slate-200"
            />
          {/if}
          <div class="text-left hidden sm:block">
            <p class="text-sm font-bold text-slate-700">
              {data.session.user?.name}
            </p>
            <button
              onclick={() => signOut()}
              class="text-xs text-red-500 hover:text-red-600 font-medium"
              >Sign Out</button
            >
          </div>
          <button
            onclick={() => signOut()}
            class="sm:hidden text-xs text-red-500 hover:text-red-600 font-medium px-2"
            >Sign Out</button
          >
        </div>
      {:else}
        <button
          onclick={openLoginPopup}
          class="flex items-center gap-2 bg-[#FEE500] hover:bg-[#FDD835] text-[#3c1e1e] px-6 py-3 rounded-xl font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
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
        class="h-[600px] flex items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse"
      >
        <p class="text-slate-400 font-medium">Loading your schedule...</p>
      </div>
    {:else if query.isError}
      <div
        class="h-[600px] flex flex-col items-center justify-center bg-red-50 rounded-3xl border border-red-100 shadow-sm"
      >
        <p class="text-red-500 font-bold mb-2">Failed to load events</p>
        <button onclick={() => query.refetch()} class="text-red-600 underline"
          >Try again</button
        >
      </div>
    {:else}
      <CalendarGrid
        events={query.data || []}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
      />
    {/if}
  {:else}
    <div class="relative">
      <div
        class="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-3xl border border-slate-100"
      >
        <p class="text-xl font-bold text-slate-400 mb-4">
          Please login to manage your schedule
        </p>
        <button
          onclick={openLoginPopup}
          class="bg-maple-orange-500 hover:bg-maple-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-200 transition-all hover:-translate-y-1"
        >
          Get Started
        </button>
      </div>
      <!-- Blurred preview -->
      <div class="filter blur-sm pointer-events-none opacity-50 select-none">
        <CalendarGrid
          events={[]}
          onDateClick={() => {}}
          onEventClick={() => {}}
        />
      </div>
    </div>
  {/if}
</main>
