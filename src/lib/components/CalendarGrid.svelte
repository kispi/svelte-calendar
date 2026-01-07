<script>
    import {
        format,
        startOfMonth,
        endOfMonth,
        startOfWeek,
        endOfWeek,
        eachDayOfInterval,
        isSameMonth,
        isSameDay,
        addMonths,
        subMonths,
        isToday,
        setMonth,
        setYear,
    } from "date-fns";

    /**
     * @typedef {Object} CalendarProps
     * @property {any[]} events
     * @property {(date: Date) => void} onDateClick
     * @property {(event: any) => void} onEventClick
     */

    /** @type {CalendarProps} */
    let { events, onDateClick, onEventClick } = $props();

    let currentDate = $state(new Date());

    // Derived state for calendar grid
    let monthStart = $derived(startOfMonth(currentDate));
    let monthEnd = $derived(endOfMonth(monthStart));
    let startDate = $derived(startOfWeek(monthStart));
    let endDate = $derived(endOfWeek(monthEnd));

    let days = $derived(
        eachDayOfInterval({
            start: startDate,
            end: endDate,
        }),
    );

    // Navigation handlers
    function nextMonth() {
        currentDate = addMonths(currentDate, 1);
    }

    function prevMonth() {
        currentDate = subMonths(currentDate, 1);
    }

    /** @param {Event} e */
    function handleMonthChange(e) {
        // @ts-ignore
        const newMonth = parseInt(e.target.value);
        currentDate = setMonth(currentDate, newMonth);
    }

    /** @param {Event} e */
    function handleYearChange(e) {
        // @ts-ignore
        const newYear = parseInt(e.target.value);
        currentDate = setYear(currentDate, newYear);
    }

    /** @param {Date} day */
    function getEventsForDay(day) {
        return events.filter((event) => {
            if (!event.startTime) return false;
            // Handle both ISO strings (migrated) and potentially Date objects (if parsing changes)
            const eventDate = new Date(event.startTime);
            return isSameDay(eventDate, day);
        });
    }

    // Generate years for dropdown (current year +/- 5)
    let years = $derived(
        Array.from({ length: 11 }, (_, i) => currentDate.getFullYear() - 5 + i),
    );
    let months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
</script>

<div
    class="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100"
>
    <!-- Header -->
    <div
        class="p-6 flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-orange-50 to-white border-b border-orange-100 gap-4"
    >
        <div class="flex items-center gap-2">
            <select
                class="bg-transparent text-2xl font-bold text-maple-orange-600 focus:outline-none focus:ring-2 focus:ring-maple-orange-200 rounded-lg cursor-pointer"
                value={currentDate.getMonth()}
                onchange={handleMonthChange}
            >
                {#each months as month, i}
                    <option value={i}>{month}</option>
                {/each}
            </select>
            <select
                class="bg-transparent text-2xl font-light text-slate-400 focus:outline-none focus:ring-2 focus:ring-maple-orange-200 rounded-lg cursor-pointer"
                value={currentDate.getFullYear()}
                onchange={handleYearChange}
            >
                {#each years as year}
                    <option value={year}>{year}</option>
                {/each}
            </select>
        </div>
        <div class="flex gap-2">
            <button
                onclick={prevMonth}
                aria-label="Previous Month"
                class="p-2 hover:bg-orange-100/50 rounded-full transition-colors text-maple-orange-500"
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
                    class="lucide lucide-chevron-left"
                    ><path d="m15 18-6-6 6-6" /></svg
                >
            </button>
            <button
                onclick={nextMonth}
                aria-label="Next Month"
                class="p-2 hover:bg-orange-100/50 rounded-full transition-colors text-maple-orange-500"
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
                    class="lucide lucide-chevron-right"
                    ><path d="m9 18 6-6-6-6" /></svg
                >
            </button>
        </div>
    </div>

    <!-- Weekdays -->
    <div class="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
        {#each ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as day}
            <div
                class="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider"
            >
                {day}
            </div>
        {/each}
    </div>

    <!-- Days Grid -->
    <div class="grid grid-cols-7 auto-rows-fr h-[600px] lg:h-[700px]">
        {#each days as day}
            <div
                class="
                    min-h-[80px] border-b border-r border-slate-50 p-2 transition-colors
                    {isSameMonth(day, monthStart)
                    ? 'bg-white hover:bg-orange-50/30'
                    : 'bg-slate-50/30 text-slate-300'}
                    cursor-pointer relative
                "
                role="button"
                tabindex="0"
                onclick={() => onDateClick(day)}
                onkeydown={(e) => e.key === "Enter" && onDateClick(day)}
            >
                <div class="flex justify-between items-start mb-1">
                    <span
                        class="
                        text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                        {isToday(day)
                            ? 'bg-maple-orange-500 text-white shadow-md shadow-maple-orange-200'
                            : ''}
                    "
                    >
                        {format(day, "d")}
                    </span>
                </div>

                <div
                    class="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar"
                >
                    {#each getEventsForDay(day) as event}
                        <!-- svelte-ignore a11y_interactive_supports_focus -->
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <div
                            class="px-2 py-1 text-xs font-medium rounded-md truncate transition-colors shadow-sm cursor-pointer border
                            {event.type === 'diary'
                                ? 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200'
                                : 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200'}"
                            role="button"
                            onclick={(e) => {
                                e.stopPropagation();
                                onEventClick(event);
                            }}
                        >
                            {event.title}
                        </div>
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
        background-color: #fed7aa;
        border-radius: 20px;
    }
</style>
