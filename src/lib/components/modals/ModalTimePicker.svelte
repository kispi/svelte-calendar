<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { i18n } from '$lib/i18n.svelte.js'

  interface Props {
    value: string // "HH:mm"
    close: (value?: string | false) => void
  }

  let { value = '09:00', close }: Props = $props()

  let hour = $state(9)
  let minute = $state(0)

  // Parse initial value
  const parseTime = (v: string) => {
    const [h, m] = v.split(':').map(Number)
    if (!isNaN(h)) hour = h
    if (!isNaN(m)) minute = m
  }

  // Initialize
  onMount(() => {
    parseTime(value)
    scrollToCurrent()
  })

  // Arrays for generation
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5) // 0, 5, 10...

  let hourContainer = $state<HTMLElement>()
  let minuteContainer = $state<HTMLElement>()

  const scrollToCurrent = async () => {
    await tick()
    if (hourContainer) {
      const el = hourContainer.querySelector(
        `[data-value="${hour}"]`
      ) as HTMLElement
      if (el) {
        hourContainer.scrollTop =
          el.offsetTop - hourContainer.clientHeight / 2 + el.clientHeight / 2
      }
    }
    if (minuteContainer) {
      const el = minuteContainer.querySelector(
        `[data-value="${minute}"]`
      ) as HTMLElement
      if (el) {
        minuteContainer.scrollTop =
          el.offsetTop - minuteContainer.clientHeight / 2 + el.clientHeight / 2
      }
    }
  }

  const handleConfirm = () => {
    const h = String(hour).padStart(2, '0')
    const m = String(minute).padStart(2, '0')
    close(`${h}:${m}`)
  }

  const formatTime = (h: number, m: number) => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
</script>

<div
  class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden transform transition-all scale-100"
>
  <!-- Header -->
  <div
    class="bg-slate-50 dark:bg-slate-800 p-6 text-center border-b border-slate-100 dark:border-slate-700"
  >
    <div
      class="text-3xl font-bold text-slate-900 dark:text-white tracking-wider"
    >
      {formatTime(hour, minute)}
    </div>
  </div>

  <!-- Picker Columns -->
  <div class="flex h-56 relative">
    <!-- Selection Highlight Bar -->
    <div
      class="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-slate-100 dark:bg-slate-800 pointer-events-none border-y border-slate-200 dark:border-slate-700"
    ></div>

    <!-- Hours -->
    <div
      bind:this={hourContainer}
      class="flex-1 overflow-y-auto scrollbar-hide py-[92px] text-center scroll-smooth snap-y snap-mandatory relative z-10"
    >
      {#each hours as h}
        <button
          type="button"
          data-value={h}
          class="snap-center h-10 flex items-center justify-center w-full text-lg font-medium transition-colors
              {hour === h
            ? 'text-slate-900 dark:text-white font-bold scale-110'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}"
          onclick={() => {
            hour = h
            scrollToCurrent()
          }}
        >
          {String(h).padStart(2, '0')}
        </button>
      {/each}
    </div>

    <!-- Divider -->
    <div
      class="flex items-center justify-center text-slate-300 dark:text-slate-600 font-bold"
    >
      :
    </div>

    <!-- Minutes -->
    <div
      bind:this={minuteContainer}
      class="flex-1 overflow-y-auto scrollbar-hide py-[92px] text-center scroll-smooth snap-y snap-mandatory relative z-10"
    >
      {#each minutes as m}
        <button
          type="button"
          data-value={m}
          class="snap-center h-10 flex items-center justify-center w-full text-lg font-medium transition-colors
              {minute === m
            ? 'text-slate-900 dark:text-white font-bold scale-110'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}"
          onclick={() => {
            minute = m
            scrollToCurrent()
          }}
        >
          {String(m).padStart(2, '0')}
        </button>
      {/each}
    </div>
  </div>

  <!-- Footer -->
  <!-- Footer -->
  <div
    class="p-4 border-t border-slate-50 dark:border-slate-800 flex justify-end gap-3"
  >
    <button onclick={() => close()} class="btn-default">
      {i18n.t('common.cancel')}
    </button>
    <button onclick={handleConfirm} class="btn-primary">
      {i18n.t('common.confirm')}
    </button>
  </div>
</div>

<style>
  /* Hide scrollbar */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
