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
    // Force reactivity when locale changes
    const _ = i18n.locale
    return dayjs().month(idx).locale(i18n.dayjsLocale).format('MMMM')
  }
</script>

<div
  class="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden flex flex-col w-[320px]"
>
  <!-- Header with Toggles -->
  <div
    class="bg-white dark:bg-slate-900 p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800"
  >
    <div class="flex gap-2">
      {#if view === 'year'}
        <div class="flex items-center gap-2">
          <input
            type="number"
            bind:value={selectedYear}
            class="w-20 px-2 py-1.5 text-lg font-bold border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-center"
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
          class="px-3 py-1.5 rounded-lg text-lg font-bold transition-all text-slate-800 hover:bg-slate-50"
          onclick={() => (view = 'year')}
        >
          {selectedYear}
        </button>
      {/if}

      <button
        class="px-3 py-1.5 rounded-lg text-lg font-bold transition-all {view ===
        'month'
          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}"
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
  <div class="relative h-80 bg-white dark:bg-slate-900">
    {#if view === 'year'}
      <div
        class="h-full overflow-y-auto grid grid-cols-4 gap-2 p-4 content-start"
      >
        <!-- Show +/- 10 years from current selected year -->
        {#each Array.from({ length: 21 }, (_, i) => selectedYear - 10 + i) as y}
          <button
            class="px-2 py-3 rounded-lg text-sm font-medium transition-all
                {selectedYear === y
              ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105 border border-slate-100 dark:border-slate-700'}"
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
              ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-lg ring-4 ring-slate-100 dark:ring-slate-800'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-105 border border-slate-100 dark:border-slate-700'}"
            onclick={() => {
              selectedMonth = i
            }}
          >
            <span class="text-base">{i + 1}</span>
            <span
              class="text-[10px] uppercase tracking-wider {selectedMonth === i
                ? 'text-slate-300'
                : 'text-slate-400'}"
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
