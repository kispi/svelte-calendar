<script lang="ts">
  import dayjs, { type Dayjs } from 'dayjs'
  import { onMount, tick } from 'svelte'
  import { i18n } from '$lib/i18n.svelte.js'

  interface Props {
    date: Dayjs
    close: (value?: Dayjs | false) => void
  }

  let { date, close }: Props = $props()

  let selectedYear = $state(date.year())
  let selectedMonth = $state(date.month()) // 0-11

  let view = $state<'month' | 'year'>('month') // 'month' or 'year' selection view

  // Year range: current - 100 to current + 100
  const currentYear = dayjs().year()
  const years = Array.from({ length: 200 }, (_, i) => currentYear - 100 + i)

  // No manual months array needed if we use dayjs with locale

  const handleApply = () => {
    const newDate = date.year(selectedYear).month(selectedMonth)
    close(newDate)
  }

  const getMonthName = (idx: number) => {
    return dayjs().month(idx).locale(i18n.locale).format('MMMM')
  }
</script>

<div class="bg-surface rounded-2xl overflow-hidden flex flex-col w-[320px]">
  <!-- Header with Toggles -->
  <div
    class="bg-surface p-5 flex items-center justify-between border-b border-border-base"
  >
    <div class="flex gap-2">
      {#if view === 'year'}
        <div class="flex items-center gap-2">
          <input
            type="number"
            bind:value={selectedYear}
            class="w-20 px-2 py-1.5 text-lg font-bold border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-box bg-surface-hover text-content-primary text-center"
            min="1900"
            max="2100"
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                handleApply()
              }
            }}
          />
        </div>
      {:else}
        <button
          class="px-3 py-1.5 rounded-lg text-lg font-bold transition-all text-content-secondary hover:bg-surface-hover"
          onclick={() => (view = 'year')}
        >
          {selectedYear}
        </button>
      {/if}

      <button
        class="px-3 py-1.5 rounded-lg text-lg font-bold transition-all {view ===
        'month'
          ? 'bg-surface-hover text-content-primary'
          : 'text-content-muted hover:text-content-primary'}"
        onclick={() => (view = 'month')}
      >
        {getMonthName(selectedMonth)}
      </button>
    </div>

    <button onclick={handleApply} class="btn-primary">
      {i18n.t('common.confirm') || 'Confirm'}
    </button>
  </div>

  <!-- Content Area -->
  <div class="relative h-80 bg-surface">
    {#if view === 'year'}
      <div
        class="h-full overflow-y-auto grid grid-cols-4 gap-2 p-4 content-start"
      >
        <!-- Show +/- 10 years from current selected year -->
        {#each Array.from({ length: 21 }, (_, i) => selectedYear - 10 + i) as y}
          <button
            class="px-2 py-3 rounded-lg text-sm font-medium transition-all
                {selectedYear === y
              ? 'bg-brand-box text-brand-text shadow-md'
              : 'bg-surface text-content-secondary hover:bg-surface-hover hover:scale-105 border border-border-base'}"
            onclick={() => {
              selectedYear = y
              // view = 'month' // Keep in year view if manually selecting? Or switch? User habit.
              // Usually selecting a year means "I'm done with year", so switch or just stay.
              // Let's stay so they can confirm or switch themselves, or just update style.
              // Actually user requested "Limit list to +/-10".
            }}
          >
            {y}
          </button>
        {/each}
      </div>
    {:else}
      <div class="h-full grid grid-cols-3 gap-3 p-4">
        {#each Array.from({ length: 12 }) as _, i}
          <button
            class="rounded-xl text-sm font-bold transition-all flex flex-col items-center justify-center gap-1
                {selectedMonth === i
              ? 'bg-brand-box text-brand-text shadow-lg ring-4 ring-border-base'
              : 'bg-surface text-content-secondary hover:bg-surface-hover hover:scale-105 border border-border-base'}"
            onclick={() => {
              selectedMonth = i
            }}
          >
            <span class="text-base">{i + 1}</span>
            <span
              class="text-[10px] uppercase tracking-wider {selectedMonth === i
                ? 'text-content-muted'
                : 'text-content-muted'}"
            >
              {getMonthName(i).slice(0, 3)}
            </span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  /* Custom scrollbar for year list */
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #cbd5e1;
  }
</style>
