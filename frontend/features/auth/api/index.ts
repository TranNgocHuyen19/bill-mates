import { createClient } from '@/lib/supabase/client'
import { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput } from '../schemas'

import { PATHS } from '@/constants'

export interface AuthResponse {
  data: {
    accessToken: string
    user: {
      id: string
      email?: string
      name?: string
    }
  }
}

export const loginApi = async (data: LoginInput): Promise<AuthResponse> => {
  const supabase = createClient()
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!authData.session) {
    throw new Error('Vui lòng kiểm tra email của bạn để xác nhận tài khoản trước khi đăng nhập.')
  }

  return {
    data: {
      accessToken: authData.session.access_token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.user_metadata?.name || authData.user.user_metadata?.full_name
      }
    }
  }
}

export const registerApi = async (data: RegisterInput): Promise<unknown> => {
  const supabase = createClient()
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
        full_name: data.name
      }
    }
  })

  if (error) {
    throw new Error(error.message)
  }

  return authData
}

export const forgotPasswordApi = async (data: ForgotPasswordInput): Promise<unknown> => {
  const supabase = createClient()
  const { data: authData, error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}${PATHS.AUTH.RESET_PASSWORD}`
  })

  if (error) {
    throw new Error(error.message)
  }

  return authData
}

export const resetPasswordApi = async (data: ResetPasswordInput): Promise<unknown> => {
  const supabase = createClient()
  const { data: authData, error } = await supabase.auth.updateUser({
    password: data.password
  })

  if (error) {
    throw new Error(error.message)
  }

  return authData
}

export const logoutApi = async (): Promise<void> => {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error(error.message)
  }
}

