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

export function getLunarHolidays(year: number): Holiday[] {
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

function dateFormatter(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
