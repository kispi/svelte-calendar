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

  $effect(() => {
    parseTime(value)
    // Only scroll if containers are ready.
    // We use tick to ensure DOM is ready.
    tick().then(() => {
      scrollToCurrent()
    })
  })

  const ITEM_HEIGHT = 40

  const scrollToCurrent = () => {
    if (hourContainer) {
      hourContainer.scrollTop = hour * ITEM_HEIGHT
    }
    if (minuteContainer) {
      // Find index of current minute (0, 5, ... -> 0, 1, ...)
      const mIndex = minutes.indexOf(minute)
      if (mIndex !== -1) {
        minuteContainer.scrollTop = mIndex * ITEM_HEIGHT
      }
    }
  }

  const handleScroll = (e: Event, type: 'hour' | 'minute') => {
    const target = e.target as HTMLElement
    // Calculate index based on scroll position
    const index = Math.round(target.scrollTop / ITEM_HEIGHT)

    if (type === 'hour') {
      const newHour = hours[index]
      if (newHour !== undefined) hour = newHour
    } else {
      const newMinute = minutes[index]
      if (newMinute !== undefined) minute = newMinute
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
  class="bg-surface rounded-2xl shadow-modal w-full max-w-xs overflow-hidden transform transition-all scale-100"
>
  <!-- Header -->
  <div class="bg-surface p-6 text-center border-b border-border-base">
    <div class="text-3xl font-bold text-content-primary tracking-wider">
      {formatTime(hour, minute)}
    </div>
  </div>

  <!-- Picker Columns -->
  <div class="flex h-56 relative">
    <!-- Selection Highlight Bar -->
    <div
      class="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-surface-hover pointer-events-none border-y border-border-base"
    ></div>

    <!-- Hours -->
    <div
      bind:this={hourContainer}
      onscroll={(e) => handleScroll(e, 'hour')}
      class="flex-1 overflow-y-auto scrollbar-hide py-[92px] text-center snap-y snap-mandatory relative z-10"
    >
      {#each hours as h}
        <button
          type="button"
          data-value={h}
          class="snap-center h-10 flex items-center justify-center w-full text-lg font-medium transition-transform
              {hour === h
            ? 'text-content-primary font-bold scale-110'
            : 'text-content-muted hover:text-content-secondary'}"
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
    <div class="flex items-center justify-center text-content-muted font-bold">
      :
    </div>

    <!-- Minutes -->
    <div
      bind:this={minuteContainer}
      onscroll={(e) => handleScroll(e, 'minute')}
      class="flex-1 overflow-y-auto scrollbar-hide py-[92px] text-center snap-y snap-mandatory relative z-10"
    >
      {#each minutes as m}
        <button
          type="button"
          data-value={m}
          class="snap-center h-10 flex items-center justify-center w-full text-lg font-medium transition-transform
              {minute === m
            ? 'text-content-primary font-bold scale-110'
            : 'text-content-muted hover:text-content-secondary'}"
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
  <div class="p-4 border-t border-border-base flex justify-end gap-3">
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
