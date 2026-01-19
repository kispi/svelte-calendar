<script lang="ts">
  import dayjs, { type Dayjs } from 'dayjs'
  import { i18n } from '$lib/i18n.svelte.js'
  import { createDebounce } from '$lib/debounce'
  import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
  import localeData from 'dayjs/plugin/localeData'
  import type {
    Event as CalendarEvent,
    Folder as Calendar
  } from '$lib/server/db/schema'
  import Dropdown from './Dropdown.svelte'
  import { toast } from '$lib/toast.svelte.js'
  import { RRule } from '$lib/utils/rrule'
  import { logger } from '$lib/logger'

  dayjs.extend(isSameOrBefore)
  dayjs.extend(localeData)

  interface CalendarProps {
    events?: CalendarEvent[]
    calendars?: Calendar[]
    visibleCalendarIds?: string[]
    onDateClick: (date: Dayjs) => void
    onEventClick: (event: CalendarEvent) => void
    currentDate?: Dayjs
  }

  interface ExtendedEvent extends CalendarEvent {
    isRecurring?: boolean
    originalId?: string
  }

  let {
    events = [],
    calendars = [],
    visibleCalendarIds = [],
    onDateClick,
    onEventClick,
    currentDate = $bindable(dayjs())
  }: CalendarProps = $props()

  // Derived state for calendar grid using dayjs
  let monthStart = $derived(currentDate.startOf('month'))
  let monthEnd = $derived(currentDate.endOf('month'))
  let startDate = $derived(monthStart.startOf('week'))
  let endDate = $derived(monthEnd.endOf('week'))

  let days = $derived.by(() => {
    let arr = []
    let curr = startDate
    while (curr.isSameOrBefore(endDate)) {
      arr.push(curr)
      curr = curr.add(1, 'day')
    }
    return arr
  })

  // Expand Recurring Events
  let processedEvents = $derived.by(() => {
    let allEvents: ExtendedEvent[] = []
    // Safety check for date validity
    const viewStart = startDate.toDate()
    const viewEnd = endDate.toDate()

    for (const event of events) {
      if (!event.startTime) continue

      if (!event.recurrenceRule) {
        allEvents.push(event)
        continue
      }

      try {
        const eventStart = new Date(event.startTime)
        // Parse the rule string
        const options = RRule.parseString(event.recurrenceRule)
        // Set start date
        options.dtstart = eventStart

        const rule = new RRule(options as any)
        const instances = rule.between(viewStart, viewEnd, true)

        // Calculate duration
        const duration = event.endTime
          ? dayjs(event.endTime).diff(dayjs(event.startTime))
          : 60 * 60 * 1000 // 1 hour default

        // Parse exdates
        let exdates: string[] = []
        if (event.exdates) {
          try {
            exdates = JSON.parse(event.exdates)
          } catch (e) {
            // ignore
          }
        }

        for (const date of instances) {
          // Check exdates
          const isExcluded = exdates.some((ex) =>
            dayjs(ex).isSame(dayjs(date), 'day')
          )
          if (isExcluded) continue

          const instanceStart = dayjs(date)
          const instanceEnd = instanceStart.add(duration, 'ms')

          // Shallow copy with new times
          allEvents.push({
            ...event,
            id: `${event.id}_${date.getTime()}`, // Temporary unique ID
            originalId: event.id, // Keep reference to master ID
            startTime: instanceStart.toDate(), // Use Date object
            endTime: instanceEnd.toDate(), // Use Date object
            recurrenceRule: null, // It's an instance, don't re-expand
            isRecurring: true
          })
        }
      } catch (err) {
        logger.warn('Failed to expand recurrence', { error: err, event })
        allEvents.push(event) // Fallback to showing master only
      }
    }
    return allEvents
  })

  // Navigation handlers
  function nextMonth() {
    currentDate = currentDate.add(1, 'month')
  }

  function prevMonth() {
    currentDate = currentDate.subtract(1, 'month')
  }

  function handleMonthChange(e: Event) {
    const target = e.target as HTMLSelectElement
    const newMonth = parseInt(target.value)
    currentDate = currentDate.month(newMonth)
  }

  function handleYearChange(e: Event) {
    const target = e.target as HTMLSelectElement
    const newYear = parseInt(target.value)
    currentDate = currentDate.year(newYear)
  }

  let weekdays = $derived.by(() => {
    i18n.locale
    return dayjs.weekdaysShort
      ? dayjs.weekdaysShort()
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  })

  let searchQuery = $state('')
  let searchResults = $state<CalendarEvent[]>([])
  let isSearching = $state(false)
  let showSearchDropdown = $state(false)
  let lastSearchedQuery = $state('')

  let searchInput = $state<HTMLInputElement>()

  async function performSearch(query: string) {
    // If input is not focused, don't open dropdown
    // This prevents dropdown from opening when composition ends due to blur
    if (searchInput && document.activeElement !== searchInput) {
      return
    }

    const trimmedQuery = query.trim()

    if (trimmedQuery.length === 0) {
      searchResults = []
      showSearchDropdown = false
      lastSearchedQuery = ''
      return
    }

    if (trimmedQuery === lastSearchedQuery) {
      showSearchDropdown = true
      return
    }

    isSearching = true
    try {
      const res = await fetch(
        `/api/events?query=${encodeURIComponent(trimmedQuery)}`
      )
      if (res.ok) {
        // Double check focus after async await
        if (searchInput && document.activeElement !== searchInput) {
          return
        }
        searchResults = await res.json()
        showSearchDropdown = true
        lastSearchedQuery = trimmedQuery
      }
    } catch (e) {
      logger.error('Search failed:', { error: e })
    } finally {
      isSearching = false
    }
  }

  const { debounced: debouncedSearch, cleanup: cleanupSearch } = createDebounce(
    performSearch,
    300
  )

  function handleSearchInput() {
    debouncedSearch(searchQuery)
  }

  function handleSelectSearchResult(event: CalendarEvent) {
    cleanupSearch()

    const previousMonth = currentDate.format('YYYY-MM')

    if (event.startTime) {
      currentDate = dayjs(event.startTime)

      const newMonth = currentDate.format('YYYY-MM')
      if (previousMonth !== newMonth) {
        // Show toast notification when navigating to a different month
        const dateStr = currentDate.format(
          i18n.locale === 'kr' ? 'YYYY년 M월 D일' : 'MMMM D, YYYY'
        )
        toast.info(
          i18n.locale === 'kr'
            ? `${dateStr}로 이동했습니다`
            : `Navigated to ${dateStr}`,
          { position: 'top' }
        )
      }
    }
    showSearchDropdown = false
    // Don't reset searchQuery to allow re-opening dropdown with same search
    onEventClick(event)
  }

  function handleSearchFocus() {
    // Re-trigger search when focusing if there's already a query
    if (searchQuery.trim().length > 0) {
      performSearch(searchQuery)
    }
  }

  function goToday() {
    currentDate = dayjs()
  }

  function getEventsForDay(day: Dayjs) {
    return processedEvents.filter((event) => {
      // 1. Basic date check
      if (!event.startTime) return false
      const eventDate = dayjs(event.startTime)
      const isSameDay = eventDate.isSame(day, 'day')
      if (!isSameDay) return false

      // 2. Calendar Visibility Check
      if (
        event.calendarId &&
        visibleCalendarIds.length > 0 &&
        !visibleCalendarIds.includes(event.calendarId)
      ) {
        return false
      }

      return true
    })
  }

  function getEventColor(calendarId: string | null) {
    if (!calendarId) return null
    const cal = calendars.find((c) => c.id === calendarId)
    return cal ? cal.color : null
  }

  let years = $derived(
    Array.from({ length: 2140 - 2009 + 1 }, (_, i) => 2009 + i)
  )

  let months = $derived.by(() => {
    // Force dependency on locale
    i18n.locale
    return dayjs.months
      ? dayjs.months()
      : [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December'
        ]
  })
</script>

<div
  class="bg-white rounded border border-slate-100 shadow-xl overflow-hidden h-full flex flex-col"
>
  <!-- Header -->
  <div
    class="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-gravex-green-50 to-white border-b border-gravex-green-100 gap-4"
  >
    <div class="flex items-center gap-2">
      <select
        class="bg-transparent text-xl md:text-2xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-100 rounded px-1 cursor-pointer"
        value={currentDate.month()}
        onchange={handleMonthChange}
      >
        {#each months as month, i}
          <option value={i}>{month}</option>
        {/each}
      </select>
      <select
        class="bg-transparent text-xl md:text-2xl font-light text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 rounded px-1 cursor-pointer"
        value={currentDate.year()}
        onchange={handleYearChange}
      >
        {#each years as year}
          <option value={year}>{year}</option>
        {/each}
      </select>
    </div>

    <!-- Search Bar -->
    <div class="flex-1 max-w-md w-full mx-4">
      <div class="relative group">
        <input
          type="text"
          bind:this={searchInput}
          bind:value={searchQuery}
          oninput={handleSearchInput}
          onfocus={handleSearchFocus}
          placeholder={i18n.t('common.searchPlaceholder')}
          class="w-full bg-slate-100/50 border-transparent focus:bg-white focus:border-gravex-green-200 focus:ring-4 focus:ring-gravex-green-500/10 rounded-xl px-10 py-2 text-sm transition-all outline-none"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-gravex-green-500 transition-colors"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg
        >
        {#if searchQuery}
          <button
            onclick={() => (searchQuery = '')}
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
            aria-label="Clear search"
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
              ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
            >
          </button>
        {/if}

        <Dropdown
          items={searchResults}
          show={showSearchDropdown}
          onSelect={handleSelectSearchResult}
          onClose={() => (showSearchDropdown = false)}
        >
          {#snippet children(result: CalendarEvent)}
            <div class="px-4 py-3 border-b border-slate-50 last:border-b-0">
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-slate-800 truncate">
                    {result.title}
                  </div>
                  {#if result.description}
                    <div class="text-xs text-slate-500 truncate mt-0.5">
                      {result.description}
                    </div>
                  {/if}
                </div>
                {#if result.startTime}
                  <div class="text-xs text-slate-400 ml-2 shrink-0">
                    {dayjs(result.startTime).format('MMM D, YYYY')}
                  </div>
                {/if}
              </div>
            </div>
          {/snippet}
        </Dropdown>
      </div>
    </div>

    <div class="flex gap-2">
      <button
        onclick={goToday}
        aria-label={i18n.t('common.today')}
        class="px-3 py-2 text-xs font-bold text-slate-600 hover:text-gravex-green-600 hover:bg-slate-100 rounded transition-colors uppercase tracking-wider"
      >
        {i18n.t('common.today')}
      </button>
      <button
        onclick={prevMonth}
        aria-label={i18n.locale === 'kr' ? '이전 달' : 'Previous Month'}
        class="p-2 hover:bg-slate-100 rounded transition-colors text-slate-400 hover:text-slate-600"
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
          class="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6" /></svg
        >
      </button>
      <button
        onclick={nextMonth}
        aria-label={i18n.locale === 'kr' ? '다음 달' : 'Next Month'}
        class="p-2 hover:bg-slate-100 rounded transition-colors text-slate-400 hover:text-slate-600"
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
          class="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6" /></svg
        >
      </button>
    </div>
  </div>

  <!-- Weekdays -->
  <div class="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
    {#each weekdays as day}
      <div
        class="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider"
      >
        {day}
      </div>
    {/each}
  </div>

  <!-- Days Grid -->
  <div class="grid grid-cols-7 auto-rows-fr h-full overflow-hidden">
    {#each days as day}
      <div
        class="
                    min-h-[80px] border-b border-r border-slate-50 p-2 transition-colors
                    {day.isSame(monthStart, 'month')
          ? 'bg-white hover:bg-gravex-green-50/30'
          : 'bg-slate-50/30 text-slate-300'}
                    cursor-pointer relative
                "
        role="button"
        tabindex="0"
        onclick={() => onDateClick(day)}
        onkeydown={(e) => e.key === 'Enter' && onDateClick(day)}
      >
        <div class="flex justify-between items-start mb-1">
          <span
            class="
                        text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                        {day.isSame(dayjs(), 'day')
              ? 'bg-gravex-green-500 text-white shadow-md shadow-gravex-green-200'
              : ''}
                    "
          >
            {day.format('D')}
          </span>
        </div>

        <div class="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
          {#each getEventsForDay(day) as calEvent}
            <!-- svelte-ignore a11y_interactive_supports_focus -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            {@const color = getEventColor(calEvent.calendarId)}
            <button
              type="button"
              class="w-full text-left px-2 py-1 text-xs font-semibold rounded-sm truncate transition-all shadow-sm cursor-pointer border
                             {calEvent.type === 'diary'
                ? 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100'
                : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-200'}"
              style={calEvent.type !== 'diary' && color
                ? `background-color: ${color}20; color: ${color}; border-color: ${color}40;`
                : ''}
              onclick={(e) => {
                e.stopPropagation()
                // Handle recurring instances: open master event
                if (calEvent.isRecurring && calEvent.originalId) {
                  const master = events.find(
                    (e) => e.id === calEvent.originalId
                  )
                  if (master) {
                    toast.info(
                      i18n.locale === 'kr'
                        ? '반복 일정의 원본을 엽니다'
                        : 'Opening recurring event series'
                    )
                    onEventClick(master)
                    return
                  }
                }
                onEventClick(calEvent)
              }}
            >
              <div class="flex items-center gap-1">
                {#if calEvent.recurrenceRule || calEvent.isRecurring}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-repeat shrink-0"
                    ><path d="m17 2 4 4-4 4" /><path
                      d="M3 11v-1a4 4 0 0 1 4-4h14"
                    /><path d="m7 22-4-4 4-4" /><path
                      d="M21 13v1a4 4 0 0 1-4 4H3"
                    /></svg
                  >
                {/if}
                {#if calEvent.type === 'schedule' && calEvent.startTime}
                  <span class="hidden md:inline opacity-60 text-[10px]"
                    >{dayjs(calEvent.startTime).format('HH:mm')}</span
                  >
                {/if}
                <span class="truncate">{calEvent.title}</span>
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #a7f3d0;
    border-radius: 20px;
  }
</style>
