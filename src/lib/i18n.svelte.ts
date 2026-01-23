import { browser } from '$app/environment'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import 'dayjs/locale/en'
import { settings } from '$lib/store/settings.svelte.js'

type Locale = 'en' | 'kr'

const translations = {
  en: {
    common: {
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      confirm: 'Confirm',
      search: 'Search',
      searchPlaceholder: 'Search events...',
      today: 'Today',
      settings: 'Settings'
    },
    nav: {
      calendar: 'CALENDAR',
      myCalendars: 'MY CALENDARS',
      notes: 'NOTES',
      signOut: 'Sign Out',
      signOutConfirm: 'Are you sure you want to sign out?',
      import: 'Import',
      export: 'Export',
      deleteAccount: 'Delete Account',
      deleteAccountConfirm:
        'Are you sure you want to delete your account?\nYou can rejoin with the same account, but events and notes cannot be restored.\nWe recommend making a backup of your data by "Exporting" before deleting your account.',
    },
    event: {
      new: 'New Event',
      edit: 'Edit Event',
      title: 'Add title',
      location: 'Add location',
      description: 'Add description',
      schedule: 'Schedule',
      diary: 'Diary',
      allDayDiary: 'ALL-DAY DIARY',
      startTime: 'Start Time',
      endTime: 'End Time',
      deleteConfirm: 'Are you sure you want to delete this event?'
    },
    notes: {
      list: 'List',
      empty: 'Select a note to view or edit',
      create: 'Create note',
      title: 'Note Title',
      placeholder: 'Start writing...',
      back: 'Back to list',
      deleteTitle: 'Delete Note',
      deleteMessage:
        'Are you sure you want to delete this note? This cannot be undone.',
      noContent: 'No additional text',
      untitled: 'Untitled Note',
      noNotesYet: 'No notes yet'
    },
    toast: {
      exportSuccess: 'Successfully exported {count} events!',
      exportError: 'Failed to export events',
      loginRequired: 'Login required',
      popupBlocked: 'Please allow popups for this site',
      importSuccess: 'Successfully imported {count} events!',
      importError: 'Failed to import events'
    },
    locale: {
      title: 'Language Settings',
      ko: 'Korean',
      en: 'English',
      kr: 'South Korea',
      us: 'United States'
    },
    common_ui: {
      onboarding: 'Your Schedule & Notes. Simplified.',
      kakaoStart: 'Start with Kakao'
    },
    chatbot: {
      placeholder: 'Ask me anything...',
      error: 'The model is currently busy. Please try again in a moment.',
      greeting:
        'Hello! I am your assistant.\n\nTry asking:\n"How many Gym sessions did I log last month?"\n"Summarize my \'Project Alpha\' notes from this week."\n"Plan a 3-day trip to Seoul based on my travel notes."\n"What were my major expenses in my January notes?"',
      title: 'Assistant'
    },
    recurrence: {
      label: 'Repeat',
      none: 'None',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly'
    }
  },
  kr: {
    common: {
      cancel: '취소',
      save: '저장',
      delete: '삭제',
      confirm: '확인',
      search: '검색',
      searchPlaceholder: '일정 검색...',
      today: '이번 달',
      settings: '설정'
    },
    nav: {
      calendar: '달력',
      myCalendars: '내 캘린더',
      notes: '메모',
      signOut: '로그아웃',
      signOutConfirm: '로그아웃 하시겠습니까?',
      import: '가져오기',
      export: '내보내기',
      deleteAccount: '계정 삭제',
      deleteAccountConfirm:
        '정말 계정을 삭제하시겠습니까?\n동일한 계정으로 재가입은 가능하지만, 일정과 노트 등은 복구할 수 없습니다.\n계정 삭제 전 "내보내기"를 하여 일정을 백업해두시기를 권장합니다.',
    },
    event: {
      new: '새 일정',
      edit: '일정 편집',
      title: '제목 추가',
      location: '위치 추가',
      description: '설명 추가',
      schedule: '일정',
      diary: '일기',
      allDayDiary: '하루 종일 일기',
      startTime: '시작 시간',
      endTime: '종료 시간',
      deleteConfirm: '이 일정을 삭제하시겠습니까?'
    },
    notes: {
      list: '목록',
      empty: '노트를 선택하여 내용을 확인하거나 편집하세요',
      create: '새 노트 작성',
      title: '노트 제목',
      placeholder: '글을 쓰기 시작하세요...',
      back: '목록으로 돌아가기',
      deleteTitle: '노트 삭제',
      deleteMessage:
        '이 노트를 삭제하시겠습니까? 삭제된 내용은 복구할 수 없습니다.',
      noContent: '내용 없음',
      untitled: '제목 없는 노트',
      noNotesYet: '노트가 없습니다'
    },
    toast: {
      exportSuccess: '{count}개의 일정을 성공적으로 내보냈습니다!',
      exportError: '일정 내보내기에 실패했습니다',
      loginRequired: '로그인이 필요합니다',
      popupBlocked: '사이트의 팝업 차단을 해제해 주세요',
      importSuccess: '{count}개의 일정을 성공적으로 가져왔습니다!',
      importError: '일정 가져오기에 실패했습니다'
    },
    locale: {
      title: '언어 설정',
      ko: '한국어',
      en: '영어',
      kr: '대한민국',
      us: '미국'
    },
    common_ui: {
      onboarding: '일정과 메모를 한 곳에서. 심플한 하루 관리.',
      kakaoStart: '카카오로 시작하기'
    },
    recurrence: {
      label: '반복',
      none: '반복 없음',
      daily: '매일',
      weekly: '매주',
      monthly: '매월',
      yearly: '매년'
    },
    chatbot: {
      placeholder: '무엇이든 물어보세요...',
      error:
        '현재 사용량이 많아 모델이 응답할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      greeting:
        '안녕하세요! Assistant입니다.\n\n저를 이렇게 활용해보세요:\n"지난달 헬스장 몇 번 갔는지 요약해줘."\n"이번 주 \'프로젝트 A\' 관련 메모들 핵심만 뽑아줘."\n"메모장에 적어둔 예산 계획이랑 지출 내역 비교해줘."\n"다음 주 미팅 일정들 시간순으로 정리해줘."',
      title: 'Assistant'
    }
  }
}

class I18nState {
  constructor() {
    if (browser) {
      this.updateDayjs()
    }
  }

  get locale() {
    return settings.locale
  }

  setLocale(locale: Locale) {
    settings.locale = locale
    this.updateDayjs()
  }

  updateDayjs() {
    dayjs.locale(this.locale === 'kr' ? 'ko' : 'en')
  }

  t(path: string, params: Record<string, string | number> = {}) {
    const keys = path.split('.')
    let result: any = translations[this.locale]

    for (const key of keys) {
      if (!result) return path
      result = result[key as keyof typeof result]
    }

    if (typeof result !== 'string') return path

    // Replace params
    let str = result
    for (const [key, value] of Object.entries(params)) {
      str = str.replaceAll(`{${key}}`, String(value))
    }

    return str
  }
}

export const i18n = new I18nState()

