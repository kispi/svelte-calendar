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

class SettingsState {
    // We use a single reactive object for settings
    data = $state<SettingsData>({ ...DEFAULT_SETTINGS })

    constructor() {
        if (browser) {
            this.load()
        }
    }

    load() {
        try {
            // 1. Check for legacy keys and migrate if needed
            if (localStorage.getItem('last_active_tab') || localStorage.getItem('justodo_locale')) {
                this.migrate()
            }

            // 2. Load unified settings
            const saved = localStorage.getItem('settings')
            if (saved) {
                const parsed = JSON.parse(saved)
                // Merge with defaults to ensure new keys exist
                this.data = { ...DEFAULT_SETTINGS, ...parsed }
            } else if (!this.hasLegacyData()) {
                // Init locale from system if no settings ever existed
                const sysLang = navigator.language.startsWith('ko') ? 'kr' : 'en'
                this.data.locale = sysLang
            }
        } catch (e) {
            console.error('Failed to load settings', e)
        }
    }

    save() {
        if (browser) {
            localStorage.setItem('settings', JSON.stringify(this.data))
        }
    }

    hasLegacyData() {
        return localStorage.getItem('last_active_tab') ||
            localStorage.getItem('visible_calendars') ||
            localStorage.getItem('justodo_locale')
    }

    migrate() {
        try {
            const legacyTab = localStorage.getItem('last_active_tab')
            if (legacyTab === 'calendar' || legacyTab === 'notes') {
                this.lastActiveTab = legacyTab
            }

            const legacyCalendars = localStorage.getItem('visible_calendars')
            if (legacyCalendars) {
                try {
                    this.visibleCalendarIds = JSON.parse(legacyCalendars)
                } catch (e) {
                    console.error('Failed to parse legacy visible calendars', e)
                }
            }

            const legacyLocale = localStorage.getItem('justodo_locale')
            if (legacyLocale === 'en' || legacyLocale === 'kr') {
                this.locale = legacyLocale
            }

            // Save new format (handled by setters)

            // Clean up old keys
            localStorage.removeItem('last_active_tab')
            localStorage.removeItem('visible_calendars')
            localStorage.removeItem('justodo_locale')
        } catch (e) {
            console.error('Migration failed', e)
        }
    }

    // Getters and Setters with auto-save

    get lastActiveTab() {
        return this.data.lastActiveTab
    }

    set lastActiveTab(value: 'calendar' | 'notes') {
        this.data.lastActiveTab = value
        this.save()
    }

    get visibleCalendarIds() {
        return this.data.visibleCalendarIds
    }

    set visibleCalendarIds(ids: string[]) {
        this.data.visibleCalendarIds = ids
        this.save()
    }

    get locale() {
        return this.data.locale
    }

    set locale(value: 'en' | 'kr') {
        this.data.locale = value
        this.save()
    }

    get lastNoteId() {
        return this.data.lastNoteId
    }

    set lastNoteId(id: string | null) {
        this.data.lastNoteId = id
        this.save()
    }
}

export const settings = new SettingsState()
