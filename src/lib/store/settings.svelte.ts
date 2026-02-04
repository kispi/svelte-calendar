import { browser } from '$app/environment'
import type { Locale } from '$lib/i18n.svelte'

export interface SettingsData {
  lastActiveTab: 'calendar' | 'notes'
  visibleCalendarIds: string[]
  locale: Locale
  lastNoteId: string | null
  theme: 'light' | 'dark'
}

const DEFAULT_SETTINGS: SettingsData = {
  lastActiveTab: 'calendar',
  visibleCalendarIds: [],
  locale: 'en',
  lastNoteId: null,
  theme: 'light'
}

const createSettings = () => {
  let data = $state<SettingsData>({ ...DEFAULT_SETTINGS })

  if (browser) {
    const saved = localStorage.getItem('settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Force 'ko' if locale is missing or invalid
        if (!['ko', 'en'].includes(parsed.locale)) {
          parsed.locale = 'ko'
          localStorage.setItem('settings', JSON.stringify({ ...DEFAULT_SETTINGS, ...parsed }))
        }
        data = { ...DEFAULT_SETTINGS, ...parsed }
      } catch (e) {
        console.error('Failed to parse settings', e)
      }
    } else {
      // Init locale to 'ko' if no settings ever existed
      data.locale = 'ko'
      localStorage.setItem('settings', JSON.stringify(data))
    }
  }

  const save = () => {
    if (browser) {
      localStorage.setItem('settings', JSON.stringify(data))
    }
  }

  return {
    get lastActiveTab() {
      return data.lastActiveTab
    },
    set lastActiveTab(value: 'calendar' | 'notes') {
      data.lastActiveTab = value
      save()
    },
    get visibleCalendarIds() {
      return data.visibleCalendarIds
    },
    set visibleCalendarIds(ids: string[]) {
      data.visibleCalendarIds = ids
      save()
    },
    get locale() {
      return data.locale
    },
    set locale(value: Locale) {
      data.locale = value
      save()
    },
    get lastNoteId() {
      return data.lastNoteId
    },
    set lastNoteId(id: string | null) {
      data.lastNoteId = id
      save()
    },
    get theme() {
      return data.theme
    },
    set theme(value: 'light' | 'dark') {
      data.theme = value
      save()
    },
    reset() {
      data = { ...DEFAULT_SETTINGS }
      if (browser) {
        localStorage.removeItem('settings')
      }
    }
  }
}

export const settings = createSettings()
