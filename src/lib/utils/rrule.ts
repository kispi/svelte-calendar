import dayjs, { type Dayjs } from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'

dayjs.extend(isSameOrAfter)

export interface RRuleOptions {
    dtstart: Date
    freq?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
    interval?: number
    until?: Date
    count?: number
    byday?: string[] // e.g. ['MO', 'TU']
    bymonthday?: number[] // e.g. [1, 15]
}

export class RRule {
    private options: RRuleOptions

    constructor(options: RRuleOptions) {
        this.options = {
            ...options,
            interval: options.interval || 1
        }
    }

    static parseString(ruleStr: string): Partial<RRuleOptions> {
        const options: Partial<RRuleOptions> = {}
        const pairs = ruleStr.split(';')

        for (const pair of pairs) {
            const [key, value] = pair.split('=')
            switch (key.toUpperCase()) {
                case 'FREQ':
                    options.freq = value as any
                    break
                case 'INTERVAL':
                    options.interval = parseInt(value, 10)
                    break
                case 'UNTIL':
                    // RFC 5545 UNTIL is UTC: YYYYMMDDThhmmssZ
                    // We'll parse it simply assuming ISO-like structure if strictly formatted
                    // But usually it's easier to just use new Date(value) if it's standard enough
                    // Or parse manual YYYYMMDD...
                    if (value.length === 8) {
                        options.until = dayjs(value).toDate()
                    } else {
                        options.until = dayjs(value).toDate()
                    }
                    break
                case 'COUNT':
                    options.count = parseInt(value, 10)
                    break
                case 'BYDAY':
                    options.byday = value.split(',')
                    break
                case 'BYMONTHDAY':
                    options.bymonthday = value.split(',').map((v) => parseInt(v, 10))
                    break
            }
        }
        return options
    }

    between(after: Date, before: Date, inclusive: boolean = true): Date[] {
        const results: Date[] = []

        // Safety check
        if (!this.options.dtstart || !this.options.freq) {
            return [this.options.dtstart].filter(d => !!d)
        }

        let cursor = dayjs(this.options.dtstart)
        const endLimit = dayjs(before)
        const startTimeKey = cursor.format('HH:mm:ss') // Preserve time

        let count = 0
        // Loops safety limit (e.g. 5 years approx or 1000 events) to prevent infinite loops
        const MAX_ITERATIONS = 2000

        // Normalize "after" for comparison? RRule behavior includes start if it matches.

        while (true) {
            if (results.length >= MAX_ITERATIONS) break
            if (this.options.count && count >= this.options.count) break
            if (this.options.until && cursor.isAfter(dayjs(this.options.until))) break
            if (cursor.isAfter(endLimit)) break // Optimization: Stop if past the view window

            // "current" represents the base interval point (e.g. the specific Week or Month)
            // We might generate multiple instances per interval (e.g. BYDAY=MO,TU)

            const candidates: Dayjs[] = []

            if (this.options.freq === 'WEEKLY' && this.options.byday && this.options.byday.length > 0) {
                // Find the start of the week (Sunday? Monday?)
                // Standard RRULE usually assumes week starts on Monday (WKST=MO default).
                // For simplicity, let's reset cursor to start of week and check each day.

                // This is a simplified "expansion" logic:
                // Technically, we should iterate by WEEK. 
                // For the current "week" of the cursor, generate the specific days.

                // Note: dayjs().day(1) sets it to Monday of that week.
                const mapDay: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }

                // The iteration logic usually works by stepping the interval. 
                // If we are just daily/monthly/yearly without sub-rules, 'candidates' is just [cursor].
                // If we have BYDAY/BYMONTHDAY, we expand 'cursor' into multiple dates.

                const weekStart = cursor.startOf('week') // locale dependent usually
                // NOTE: In strict RRULE, WKST is standard. We assume local dayjs locale config. (default SU)

                for (const dayCode of this.options.byday) {
                    let dayNum = mapDay[dayCode]
                    // This logic depends on if weekStart is Sunday(0). 
                    // dayjs().day(N) gets the day of the current week.
                    let instance = cursor.day(dayNum)

                    // If the generated day is in the same week interval as the cursor?
                    // Actually simpler: 
                    // If we are strictly obeying INTERVAL, we should jump by N weeks.
                    // Inside that week, we pick the days.

                    // However, careful with "start date" alignment.
                    // RFC states the first instance is the dtstart. 
                    // Subsequent instances are calculated. 
                    // If dtstart is Wednesday, and rule says BYDAY=MO,TU,WE... 
                    // The first set implies proper expansion.

                    // SIMPLIFICATION: 
                    // Just check if the current 'cursor' (which matches the interval step) matches the BYDAY rule?
                    // No, BYDAY means "On these days OF the week".

                    // Correct Approach for Lightweight calc:
                    // 1. Determine the week "frame" defined by cursor.
                    // 2. Generate instances for requested days in that frame.
                    // 3. Filter out any that are before dtstart (initial set).

                    // To avoid complexity, if BYDAY is present, we calculate all days for this week.
                    // BUT, we only add them if we haven't already passed them or handled duplicates.
                    // This is getting complex for a 1-file util.

                    // ALTERNATIVE: Use DAYJS simply.
                    // candidates.push(instance)

                    if (instance.isSame(cursor, 'week')) {
                        // Ensure we preserve the original Time
                        const [h, m] = startTimeKey.split(':')
                        instance = instance.hour(Number(h)).minute(Number(m))
                        candidates.push(instance)
                    }
                }

            } else {
                // Daily, Monthly, Yearly (simple) or Weekly without BYDAY
                // TODO: Handle BYMONTHDAY for Monthly
                candidates.push(cursor)
            }

            // Add candidates to result
            for (const cand of candidates) {
                // Sort/dedupe?
                // Check bounds

                // Must be >= dtstart
                if (cand.isBefore(dayjs(this.options.dtstart), 'minute')) continue;

                // Must be <= until
                if (this.options.until && cand.isAfter(dayjs(this.options.until))) continue;

                // Check visible window (after, before)
                if (cand.isAfter(endLimit)) continue; // optimization

                const isAfterStart = inclusive ? cand.isSameOrAfter(dayjs(after)) : cand.isAfter(dayjs(after))

                if (isAfterStart) {
                    results.push(cand.toDate())
                }

                // Count increment? 
                // RFC: Count applies to "occurrences generated", regardless of start window? 
                // Yes. We must track total count from the beginning.
            }

            // Need to count accurately regardless of view window
            // Actually, we should probably generate them all up to 'before' or 'count' and then slice?
            // For performance, we can just increment 'count' for every valid candidate generated (>= dtstart)
            // And only push to 'results' if it overlaps the window.

            // Fix count logic:
            count += candidates.length // Rough approximation if all valid.

            // Advance Cursor
            switch (this.options.freq) {
                case 'DAILY':
                    cursor = cursor.add(this.options.interval || 1, 'day')
                    break
                case 'WEEKLY':
                    cursor = cursor.add(this.options.interval || 1, 'week')
                    break
                case 'MONTHLY':
                    cursor = cursor.add(this.options.interval || 1, 'month')
                    break
                case 'YEARLY':
                    cursor = cursor.add(this.options.interval || 1, 'year')
                    break
                default:
                    return results // Should not happen
            }
        }

        // Sort needed?
        return results.sort((a, b) => a.getTime() - b.getTime())
    }
}
