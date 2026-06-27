import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import envConfig from '@/lib/config'
import { showErrorToast, showSimpleToast } from '@/lib/toast'
import { getErrorMessage } from '@/lib/error-handler'
import { storage, STORAGE_KEYS } from '@/lib/local-storage'
import { API_ENDPOINTS } from '@/services/endpoints'

export const getAccessToken = (): string | null => storage.get(STORAGE_KEYS.ACCESS_TOKEN)
let isLoggingOut = false

const logLogoutDebug = (message: string, meta?: Record<string, unknown>): void => {
  if (meta) {
    console.info(`[LogoutDebug] ${message}`, meta)
    return
  }
  console.info(`[LogoutDebug] ${message}`)
}

export const setAccessToken = (token: string | null, refreshTokenExpirationMs?: number): void => {
  if (token) {
    if (isLoggingOut) {
      logLogoutDebug('Access token set while logout flag was active. Clearing logout flag.')
    }
    isLoggingOut = false
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, token)
    if (refreshTokenExpirationMs) {
      const expiryTimestamp = Date.now() + refreshTokenExpirationMs
      storage.set(STORAGE_KEYS.REFRESH_TOKEN_EXPIRATION, expiryTimestamp)
    }
  } else {
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN)
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN_EXPIRATION)
  }
}

export const clearAccessToken = (): void => {
  storage.remove(STORAGE_KEYS.ACCESS_TOKEN)
  storage.remove(STORAGE_KEYS.REFRESH_TOKEN_EXPIRATION)
}

export const startLogoutFlow = (): void => {
  logLogoutDebug('Starting local logout flow', {
    hasAccessToken: !!storage.get(STORAGE_KEYS.ACCESS_TOKEN),
    isRefreshing
  })
  isLoggingOut = true
  clearAccessToken()
  notifyRefreshSubscribers(null)
  isRefreshing = false
}

const http = axios.create({
  baseURL: envConfig.NEXT_PUBLIC_API_ENDPOINT,
  withCredentials: true
})

let isRefreshing = false
let refreshSubscribers: Array<(token: string | null) => void> = []

const subscribeRefresh = (cb: (token: string | null) => void) => {
  refreshSubscribers.push(cb)
}

const notifyRefreshSubscribers = (token: string | null) => {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

const refreshAccessToken = async (): Promise<string | null> => {
  if (isLoggingOut) {
    logLogoutDebug('Skipped refresh because logout is in progress')
    return null
  }

  try {
    const response = await axios.post(
      `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/${API_ENDPOINTS.AUTH.REFRESH}`,
      {},
      { withCredentials: true }
    )

    if (isLoggingOut) {
      logLogoutDebug('Refresh response received after logout started. Ignoring new token.')
      return null
    }

    const newToken = response.data?.data?.accessToken ?? null
    setAccessToken(newToken)
    return newToken
  } catch (err) {
    const code = (err as AxiosError<{ code?: number }>)?.response?.data?.code
    if (code === 1013) {
      clearAccessToken()
      showErrorToast('Tài khoản của bạn đã bị cấm', 4000)
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    }
    return null
  }
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const locale = storage.get(STORAGE_KEYS.LOCALE) || 'vi'
  config.headers['Accept-Language'] = locale
  const isAuthEndpoint =
    config.url?.includes(API_ENDPOINTS.AUTH.LOGIN) ||
    config.url?.includes(API_ENDPOINTS.AUTH.REGISTER) ||
    config.url?.includes(API_ENDPOINTS.AUTH.REFRESH) ||
    config.url?.includes(API_ENDPOINTS.AUTH.LOGOUT)

  if (isAuthEndpoint) return config

  const token = getAccessToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
}, Promise.reject)

http.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    const responseData = error.response?.data as { code?: number } | undefined

    if (isLoggingOut) {
      logLogoutDebug('Interceptor rejected request because logout is in progress', {
        url: originalRequest?.url,
        method: originalRequest?.method,
        status: error.response?.status
      })
      return Promise.reject(error)
    }

    // Account banned — show message then redirect
    if (responseData?.code === 1013) {
      clearAccessToken()
      showErrorToast('Tài khoản của bạn đã bị cấm', 4000)
      if (!window.location.pathname.includes('/login')) {
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
      return Promise.reject(error)
    }

    if (error.response) {
      const status = error.response.status
      if (status >= 500) {
        showErrorToast(getErrorMessage(error))
      } else if (status >= 400 && status !== 401 && responseData?.code !== 1013) {
        showSimpleToast(getErrorMessage(error))
      }
    }

    if (!originalRequest || (error.response?.status !== 401 && (error.response?.status ?? 0) < 500)) {
      return Promise.reject(error)
    }

    if (error.response && error.response.status >= 500) {
      return Promise.reject(error)
    }

    const isAuthEndpoint =
      originalRequest.url?.includes(API_ENDPOINTS.AUTH.LOGIN) ||
      originalRequest.url?.includes(API_ENDPOINTS.AUTH.REGISTER) ||
      originalRequest.url?.includes(API_ENDPOINTS.AUTH.REFRESH) ||
      originalRequest.url?.includes(API_ENDPOINTS.AUTH.LOGOUT)

    if (isAuthEndpoint) {
      return Promise.reject(error)
    }

    if (originalRequest._retry) {
      clearAccessToken()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeRefresh((token) => {
          if (token && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          resolve(http(originalRequest))
        })
      })
    }

    isRefreshing = true

    try {
      const newToken = await refreshAccessToken()

      if (isLoggingOut || !newToken) {
        logLogoutDebug('Refresh retry stopped', {
          reason: isLoggingOut ? 'logout-in-progress' : 'no-new-token',
          url: originalRequest.url
        })
        notifyRefreshSubscribers(null)
        return Promise.reject(error)
      }

      notifyRefreshSubscribers(newToken)

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
      }

      return http(originalRequest)
    } catch (refreshError) {
      notifyRefreshSubscribers(null)
      clearAccessToken()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default http
