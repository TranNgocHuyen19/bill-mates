import axios, { AxiosError } from 'axios'

import { createClient } from '@/lib/supabase/client'
import envConfig from '@/lib/config'
import { getErrorMessage } from '@/lib/error-handler'
import { showErrorToast, showSimpleToast } from '@/lib/toast'

const http = axios.create({
  baseURL: envConfig.NEXT_PUBLIC_API_ENDPOINT,
  timeout: 15_000
})

http.interceptors.request.use(async (config) => {
  const {
    data: { session }
  } = await createClient().auth.getSession()

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status

    if (status === 401 && typeof window !== 'undefined') {
      await createClient().auth.signOut({ scope: 'local' })
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login'
      }
    } else if (status && status >= 500) {
      showErrorToast(getErrorMessage(error))
    } else if (status && status >= 400) {
      showSimpleToast(getErrorMessage(error))
    }

    return Promise.reject(error)
  }
)

export default http
