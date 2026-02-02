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
  import { getAllHolidays } from '$lib/holidays'

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
    isRedDay?: boolean
  }

  let {
    events = [],
    calendars = [],
    visibleCalendarIds = [],
    onDateClick,
    onEventClick,
    currentDate = $bindable(dayjs())
  }: CalendarProps = $props()

  import { modal } from '$lib/modal.svelte.js'
  import ModalMonthYearPicker from './modals/ModalMonthYearPicker.svelte'

  const openMonthPicker = async () => {
    const newDate = await modal.show<Dayjs | undefined>(
      ModalMonthYearPicker,
      {
        date: currentDate
      },
      {
        wrapperClass: 'w-auto'
      }
    )
    if (newDate) {
      currentDate = newDate
    }
  }

  // Format header date
  let headerDateDisplay = $derived.by(() => {
    // Force reactivity on locale change
    const locale = i18n.locale
    const d = currentDate.locale(i18n.dayjsLocale)
    return d.format(i18n.t('formats.monthYear'))
  })

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

    // Inject Client-Side Holidays
    // Determine years to fetch (Current year of view +/- 1 usually safe)
    const years = new Set<number>()
    years.add(startDate.year())
    years.add(endDate.year())

    const generatedHolidays: ExtendedEvent[] = []

    // Using import from existing tool
    // We need to import getAllHolidays. I'll add the import in a separate tool call if needed or assume it's there?
    // Let's add the import line first in another step or try to reference if I can.
    // wait, I can edit multiple chunks? ReplaceFileContent is single chunk.
    // I will assume I add the import at the top later.

    // Actually, I can just write the logic here assuming getAllHolidays is imported.

    for (const y of years) {
      // @ts-ignore - getAllHolidays will be imported
      const hols = getAllHolidays(y)
      for (const h of hols) {
        const [yStr, mStr, dStr] = h.date.split('-').map(Number)
        const start = new Date(yStr, mStr - 1, dStr, 0, 0, 0)
        const end = new Date(yStr, mStr - 1, dStr, 23, 59, 59)

        generatedHolidays.push({
          id: `holiday-${h.date}-${h.title}`,
          title: h.title,
          description: '공휴일',
          location: null,
          lat: null,
          lng: null,
          locationAddress: null,
          placeId: null,
          startTime: start,
          endTime: end,
          type: 'holiday',
          calendarId: 'system-holidays',
          recurrenceRule: null,
          exdates: null,
          isSystemEvent: true, // Custom property
          isRedDay: h.isRedDay
        } as any)
      }
    }

    // Add holidays (filtered by view range if we want, or processedEvents will filter?)
    // This derived calls is for *all* events to be processed/expanded.
    // Later `getEventsForDay` filters them by day.
    allEvents.push(...generatedHolidays)

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
  // Navigation handlers
  const nextMonth = () => {
    currentDate = currentDate.add(1, 'month')
  }

  const prevMonth = () => {
    currentDate = currentDate.subtract(1, 'month')
  }

  const handleMonthChange = (e: Event) => {
    const target = e.target as HTMLSelectElement
    const newMonth = parseInt(target.value)
    currentDate = currentDate.month(newMonth)
  }

  const handleYearChange = (e: Event) => {
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
  let showSearchDropdown = $state(false)
  let lastSearchedQuery = $state('')

  let searchInput = $state<HTMLInputElement>()

  const performSearch = async (query: string) => {
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
    }
  }

  const { debounced: debouncedSearch, cleanup: cleanupSearch } = createDebounce(
    performSearch,
    300
  )

  const handleSearchInput = () => {
    debouncedSearch(searchQuery)
  }

  const handleSelectSearchResult = (event: CalendarEvent) => {
    cleanupSearch()

    const previousMonth = currentDate.format('YYYY-MM')

    if (event.startTime) {
      currentDate = dayjs(event.startTime)

      const newMonth = currentDate.format('YYYY-MM')
      if (previousMonth !== newMonth) {
        // Show toast notification when navigating to a different month
        const dateStr = currentDate.format(i18n.t('formats.longDate'))
        toast.info(i18n.t('toast.navigatedToDate', { date: dateStr }), {
          position: 'top'
        })
      }
    }
    showSearchDropdown = false
    // Don't reset searchQuery to allow re-opening dropdown with same search
    onEventClick(event)
  }

  const handleSearchFocus = () => {
    // Re-trigger search when focusing if there's already a query
    if (searchQuery.trim().length > 0) {
      performSearch(searchQuery)
    }
  }

  const goToday = () => {
    currentDate = dayjs()
  }

  const isSystemEvent = (event: CalendarEvent) => {
    if (event.type === 'holiday') return true
    return false
  }

  const getEventsForDay = (day: Dayjs) => {
    return processedEvents.filter((event) => {
      // 1. Basic date check
      if (!event.startTime) return false
      const eventDate = dayjs(event.startTime)
      const isSameDay = eventDate.isSame(day, 'day')
      if (!isSameDay) return false

      // 2. Calendar Visibility Check
      if (
        event.calendarId &&
        !visibleCalendarIds.includes(event.calendarId) &&
        !isSystemEvent(event) // Always show system events (holidays)
      ) {
        return false
      }

      return true
    })
  }

  const getEventColor = (calendarId: string | null) => {
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

<div class="h-full flex flex-col bg-surface">
  <!-- Header -->
  <div
    class="px-4 py-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4"
  >
    <div class="relative z-20">
      <button
        onclick={openMonthPicker}
        class="flex items-center gap-2 text-2xl font-black text-content-primary hover:text-gravex-primary-600 dark:hover:text-gravex-primary-400 cursor-pointer group select-none tracking-tight"
      >
        <span>{headerDateDisplay}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-slate-300 group-hover:text-gravex-primary-500"
          ><path d="m6 9 6 6 6-6" /></svg
        >
      </button>
    </div>

    <!-- Search Bar -->
    <div class="flex-1 max-w-sm w-full mx-4">
      <div class="relative group">
        <input
          type="text"
          bind:this={searchInput}
          bind:value={searchQuery}
          oninput={handleSearchInput}
          onfocus={handleSearchFocus}
          placeholder={i18n.t('common.searchPlaceholder')}
          class="w-full bg-surface-hover border-transparent focus:bg-surface focus:border-gravex-primary-200 focus:ring-4 focus:ring-gravex-primary-500/10 dark:focus:ring-gravex-primary-500/20 rounded-xl px-10 py-2.5 text-sm font-medium outline-none placeholder:text-content-muted text-content-primary"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-gravex-primary-500"
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
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
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
            <div
              class="px-4 py-3 border-b border-border-base last:border-b-0 group/item hover:bg-surface-hover"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-content-primary truncate">
                    {result.title}
                  </div>
                  {#if result.description}
                    <div class="text-xs text-content-muted truncate mt-0.5">
                      {result.description}
                    </div>
                  {/if}
                </div>
                {#if result.startTime}
                  <div
                    class="text-xs text-content-muted ml-2 shrink-0 font-medium"
                  >
                    {dayjs(result.startTime).format('MMM D')}
                  </div>
                {/if}
              </div>
            </div>
          {/snippet}
        </Dropdown>
      </div>
    </div>

    <div class="flex gap-1 bg-surface-hover p-1 rounded-lg">
      <button
        onclick={goToday}
        aria-label={i18n.t('common.today')}
        class="px-3 py-1.5 text-xs font-bold text-content-secondary hover:text-gravex-primary-600 dark:hover:text-gravex-primary-400 hover:bg-surface rounded-md transition-all uppercase tracking-wider shadow-sm hover:shadow"
      >
        {i18n.t('common.today')}
      </button>
      <div class="w-px bg-content-muted my-1 mx-1"></div>
      <button
        onclick={prevMonth}
        class="p-1.5 hover:bg-surface rounded-md transition-all text-content-secondary hover:text-content-primary hover:shadow-sm"
        aria-label={i18n.t('common.prevMonth')}
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
          class="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6" /></svg
        >
      </button>
      <button
        onclick={nextMonth}
        class="p-1.5 hover:bg-surface rounded-md transition-all text-content-secondary hover:text-content-primary hover:shadow-sm"
        aria-label={i18n.t('common.nextMonth')}
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
          class="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6" /></svg
        >
      </button>
    </div>
  </div>

  <!-- Weekdays -->
  <div class="grid grid-cols-7 border-b border-border-base bg-surface-hover/50">
    {#each weekdays as day}
      <div
        class="py-4 text-center text-xs font-black text-content-muted uppercase tracking-widest"
      >
        {day}
      </div>
    {/each}
  </div>

  <!-- Days Grid -->
  <div
    class="grid grid-cols-7 auto-rows-fr h-full overflow-hidden border-l border-border-base"
  >
    {#each days as day}
      {@const dayEvents = getEventsForDay(day)}
      {@const systemEvent = dayEvents.find((e) => isSystemEvent(e))}
      {@const normalEvents = dayEvents.filter((e) => !isSystemEvent(e))}
      <div
        class="
                    border-b border-r border-border-base p-2
                    cursor-pointer relative
                    outline-none h-full flex flex-col overflow-hidden
                    {day.isSame(monthStart, 'month')
          ? 'bg-surface hover:bg-gray-50 dark:hover:bg-white/[0.02]'
          : 'bg-gray-50/30 dark:bg-white/[0.01] text-content-muted opacity-60 hover:opacity-100 hover:bg-gray-50 dark:hover:bg-white/[0.02]'}
                "
        role="button"
        tabindex="0"
        onclick={() => onDateClick(day)}
        onkeydown={(e) => e.key === 'Enter' && onDateClick(day)}
      >
        <div class="flex justify-between items-start mb-1 max-w-full shrink-0">
          <div class="flex items-center min-w-0 flex-1">
            <span
              class="
                          text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full shrink-0
                          {day.isSame(dayjs(), 'day')
                ? 'bg-gravex-primary-500 text-white'
                : 'text-content-secondary'}
                          {(systemEvent &&
                systemEvent.isRedDay &&
                !day.isSame(dayjs(), 'day')) ||
              (day.day() === 0 && !day.isSame(dayjs(), 'day'))
                ? '!text-red-500'
                : ''}
                      "
            >
              {day.format('D')}
            </span>
            {#if systemEvent}
              <span
                class="text-xs font-normal truncate ml-1 flex-1 {systemEvent.isRedDay
                  ? 'text-red-500'
                  : 'text-content-muted'}"
                title={systemEvent.title}
              >
                {systemEvent.title}
              </span>
            {/if}
          </div>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          {#each normalEvents as calEvent}
            <!-- svelte-ignore a11y_interactive_supports_focus -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            {@const color = getEventColor(calEvent.calendarId)}
            <button
              type="button"
              class="w-full text-left px-1 py-1 text-xs font-semibold rounded-[4px] truncate cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10"
              style={color ? `color: ${color};` : 'color: #64748b;'}
              onclick={(e) => {
                e.stopPropagation()
                // Handle recurring instances: open master event
                if (calEvent.isRecurring && calEvent.originalId) {
                  const master = events.find(
                    (e) => e.id === calEvent.originalId
                  )
                  if (master) {
                    toast.info(i18n.t('toast.openingRecurringMaster'))
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
