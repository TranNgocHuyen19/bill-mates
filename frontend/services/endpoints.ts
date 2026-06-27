export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: 'auth/login',
    LOGOUT: 'auth/logout',
    REFRESH: 'auth/refresh',
    REGISTER: 'auth/register'
  },
  USER: {
    ME: 'users/me'
  }
} as const
