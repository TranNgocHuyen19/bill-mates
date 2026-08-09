export const PATHS = {
  HOME: '/',
  ROOMS: '/rooms',
  ROOM_DETAIL: (id: string) => `/rooms/${id}`,
  ROOM_SETTINGS: (id: string) => `/rooms/${id}/settings`,
  EXPENSES: {
    INDEX: '/expenses',
    NEW: '/expenses/new',
    SPLIT: '/expenses/new/split',
    CONFIRM: '/expenses/new/confirm'
  },
  DEBTS: {
    INDEX: '/debts',
    SETTLE: '/debts/settle'
  },
  HISTORY: '/history',
  PROFILE: '/profile',
  ABOUT: '/about',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password'
  },
  LEGACY: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password'
  }
} as const

export type PathValues = typeof PATHS
