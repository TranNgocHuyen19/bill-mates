import { z } from 'zod'

const APP_PREFIX = 'billmates_'

export const STORAGE_KEYS = {
  THEME: `${APP_PREFIX}theme`,
  ACCESS_TOKEN: `${APP_PREFIX}access_token`,
  REFRESH_TOKEN: `${APP_PREFIX}refresh_token`,
  REFRESH_TOKEN_EXPIRATION: `${APP_PREFIX}refresh_token_expiration`,
  USER_PROFILE: `${APP_PREFIX}user_profile`,
  SETTINGS: `${APP_PREFIX}settings`,
  LOCALE: `${APP_PREFIX}locale`
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

export const storage = {
  get: <T>(key: StorageKey, defaultValue?: T): T | null => {
    if (typeof window === 'undefined') return defaultValue ?? null

    try {
      const item = window.localStorage.getItem(key)
      if (item === null) return defaultValue ?? null
      try {
        return JSON.parse(item) as T
      } catch {
        return item as unknown as T
      }
    } catch (error) {
      console.warn(`Error reading key "${key}" from localStorage:`, error)
      return defaultValue ?? null
    }
  },

  set: <T>(key: StorageKey, value: T): void => {
    if (typeof window === 'undefined') return

    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)
      window.localStorage.setItem(key, serializedValue)
    } catch (error) {
      console.warn(`Error setting key "${key}" to localStorage:`, error)
    }
  },

  remove: (key: StorageKey): void => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
  },

  clear: (): void => {
    if (typeof window === 'undefined') return
    Object.keys(window.localStorage).forEach((k) => {
      if (k.startsWith(APP_PREFIX)) {
        window.localStorage.removeItem(k)
      }
    })
  },

  getValid: <T>(key: StorageKey, schema: z.Schema<T>, defaultValue?: T): T | null => {
    const data = storage.get(key)
    if (!data) return defaultValue ?? null

    const result = schema.safeParse(data)
    if (result.success) {
      return result.data
    } else {
      console.error(`Data in localStorage for key "${key}" is invalid:`, result.error)
      storage.remove(key)
      return defaultValue ?? null
    }
  }
}
