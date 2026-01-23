import KoreanLunarCalendar from 'korean-lunar-calendar'

export interface Holiday {
  date: string
  title: string
  isRedDay: boolean
}

export const holidays: Holiday[] = [
  { date: '01-01', title: '신정', isRedDay: true },
  { date: '03-01', title: '삼일절', isRedDay: true },
  { date: '05-05', title: '어린이날', isRedDay: true },
  { date: '06-06', title: '현충일', isRedDay: true },
  { date: '07-17', title: '제헌절', isRedDay: false },
  { date: '08-15', title: '광복절', isRedDay: true },
  { date: '10-03', title: '개천절', isRedDay: true },
  { date: '10-09', title: '한글날', isRedDay: true },
  { date: '12-25', title: '크리스마스', isRedDay: true }
]

export const getLunarHolidays = (year: number): Holiday[] => {
  const calendar = new KoreanLunarCalendar()
  const list: Holiday[] = []

  // Seollal (Lunar 1.1) - Day before, Day of, Day after
  // Note: Simple +/- 1 day on Solar calendar is NOT correct for "Day before/after Lunar".
  // Actually, Korean holidays are defined as "Preceding day of Seollal, Seollal, Next day of Seollal".
  // So we calculate Lunar 12.30 (of prev year) or 12.29?, Lunar 1.1, Lunar 1.2.
  // Wait, "Day before Seollal" is the last day of the previous lunar month.
  // "Day after Seollal" is Lunar 1.2.

  // Let's stick to the official definition:
  // 1. Lunar 1.1 (Seollal)
  calendar.setLunarDate(year, 1, 1, false)
  const seollal = calendar.getSolarCalendar()

  // 2. Day before Seollal (Lunar 12.30 of prev year? Or just Solar date - 1?)
  // Legally it is "the day preceding the Seollal". Since Seollal is determined by Lunar 1.1, the preceding day is physically the day before.
  // So we can just take the Solar Date of Seollal and subtract 1 day.
  const sDate = new Date(seollal.year, seollal.month - 1, seollal.day)
  const sPrev = new Date(sDate)
  sPrev.setDate(sDate.getDate() - 1)
  const sNext = new Date(sDate)
  sNext.setDate(sDate.getDate() + 1)

  const seollalTitle = '설날'

  list.push({ date: dateFormatter(sPrev), title: seollalTitle, isRedDay: true })
  list.push({ date: dateFormatter(sDate), title: seollalTitle, isRedDay: true })
  list.push({ date: dateFormatter(sNext), title: seollalTitle, isRedDay: true })

  // Chuseok (Lunar 8.15)
  calendar.setLunarDate(year, 8, 15, false)
  const chuseok = calendar.getSolarCalendar()
  const cDate = new Date(chuseok.year, chuseok.month - 1, chuseok.day)
  const cPrev = new Date(cDate)
  cPrev.setDate(cDate.getDate() - 1)
  const cNext = new Date(cDate)
  cNext.setDate(cDate.getDate() + 1)

  const chuseokTitle = '추석'

  list.push({ date: dateFormatter(cPrev), title: chuseokTitle, isRedDay: true })
  list.push({ date: dateFormatter(cDate), title: chuseokTitle, isRedDay: true })
  list.push({ date: dateFormatter(cNext), title: chuseokTitle, isRedDay: true })

  // Buddha's Birthday (Lunar 4.8)
  calendar.setLunarDate(year, 4, 8, false)
  const buddha = calendar.getSolarCalendar()
  const bDate = new Date(buddha.year, buddha.month - 1, buddha.day)

  list.push({ date: dateFormatter(bDate), title: '석가탄신일', isRedDay: true })

  return list
}

// Helper to check if a year is a leap year (though Date object handles it, useful if needed, but Date is better)

export const getAllHolidays = (year: number): Holiday[] => {
  const list: Holiday[] = []

  // 1. Fixed Holidays
  for (const h of holidays) {
    const [m, d] = h.date.split('-').map(Number)
    const date = new Date(year, m - 1, d)
    // Validate if valid date (e.g. Feb 29 on non-leap year)
    if (date.getMonth() !== m - 1) continue

    list.push({
      date: dateFormatter(date),
      title: h.title,
      isRedDay: h.isRedDay,
      originalDate: date // Internal use for subs
    } as Holiday & { originalDate?: Date })
  }

  // 2. Lunar Holidays
  const lunar = getLunarHolidays(year)
  list.push(...lunar)

  // 3. Substitutes
  // Logic from previous server implementation (with slight improvements if needed)
  // Current rule: If Red Day overlaps Sat/Sun, substitute on next non-holiday?
  // Previous logic found in server:
  // - Skip '설날'/'추석' (Why? Maybe handled differently or just excluded in that snippet?)
  // - For others: If Sat or Sun -> Mon or Tue.

  // Updates for 2025/2026 Korean laws:
  // - Seollal/Chuseok: Sub if Sunday (not Sat).
  // - Children's Day: Sub if Sat or Sun.
  // - Others (3.1, 8.15, 10.3, 10.9, 12.25, 1.1, 6.6, Buddha):
  //   - Actually 1.1 and 6.6, 12.25 might NOT have substitutes yet depending on exact law, but 
  //     recent changes expanded it. 
  //     Let's stick to the "Generic Sat/Sun -> Sub" logic found in server for consistency,
  //     BUT we must be careful not to duplicate if we want to be exact.
  //     However, user asked to "Refactor", implying preserving behavior.
  //     The server logic was:
  //       if (dayOfWeek === 0 || dayOfWeek === 6) { add sub }
  //       EXCEPT Seollal/Chuseok.

  // Let's copy that logic for now to ensure no regression in behavior, 
  // but we can clean it up.

  const generatedSubstitutes: Holiday[] = []

  for (const h of list) {
    if (!h.isRedDay) continue
    // Filter explicitly as per server logic
    if (h.title === '설날' || h.title === '추석') continue

    // The 'date' string is YYYY-MM-DD
    const d = new Date(h.date)
    const day = d.getDay() // 0=Sun, 6=Sat

    if (day === 0 || day === 6) {
      const subDays = day === 0 ? 1 : 2
      const subDate = new Date(d)
      subDate.setDate(d.getDate() + subDays)

      generatedSubstitutes.push({
        date: dateFormatter(subDate),
        title: `대체공휴일 (${h.title})`,
        isRedDay: true
      })
    }
  }

  return [...list, ...generatedSubstitutes].sort((a, b) => a.date.localeCompare(b.date))
}

const dateFormatter = (d: Date): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
