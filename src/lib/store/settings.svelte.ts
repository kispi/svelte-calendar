import { browser } from '$app/environment'

export interface SettingsData {
  lastActiveTab: 'calendar' | 'notes'
  visibleCalendarIds: string[]
  locale: 'en' | 'kr'
  lastNoteId: string | null
}

const DEFAULT_SETTINGS: SettingsData = {
  lastActiveTab: 'calendar',
  visibleCalendarIds: [],
  locale: 'en',
  lastNoteId: null
}

const createSettings = () => {
  let data = $state<SettingsData>({ ...DEFAULT_SETTINGS })

  if (browser) {
    const saved = localStorage.getItem('settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        data = { ...DEFAULT_SETTINGS, ...parsed }
      } catch (e) {
        console.error('Failed to parse settings', e)
      }
    } else {
      // Init locale from system if no settings ever existed
      const sysLang = navigator.language.startsWith('ko') ? 'kr' : 'en'
      data.locale = sysLang
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
    set locale(value: 'en' | 'kr') {
      data.locale = value
      save()
    },
    get lastNoteId() {
      return data.lastNoteId
    },
    set lastNoteId(id: string | null) {
      data.lastNoteId = id
      save()
    }
  }
}

export const settings = createSettings()
