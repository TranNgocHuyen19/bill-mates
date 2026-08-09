import type { Session, User } from '@supabase/supabase-js'

import { PATHS } from '@/constants'
import { createClient } from '@/lib/supabase/client'
import type { ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from '../schemas'

export interface AuthResult {
  session: Session | null
  user: User
}

export const loginApi = async (data: LoginInput): Promise<AuthResult> => {
  const { data: authData, error } = await createClient().auth.signInWithPassword(data)
  if (error) throw error
  if (!authData.user) throw new Error('Không tìm thấy tài khoản đăng nhập.')
  if (!authData.session) {
    throw new Error('Vui lòng xác nhận email trước khi đăng nhập.')
  }
  return { session: authData.session, user: authData.user }
}

export const registerApi = async (data: RegisterInput): Promise<AuthResult> => {
  const { data: authData, error } = await createClient().auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
        full_name: data.name
      }
    }
  })
  if (error) throw error
  if (!authData.user) throw new Error('Không thể tạo tài khoản.')
  return { session: authData.session, user: authData.user }
}

export const forgotPasswordApi = async (data: ForgotPasswordInput): Promise<void> => {
  const { error } = await createClient().auth.resetPasswordForEmail(data.email, {
    redirectTo: `${window.location.origin}${PATHS.AUTH.RESET_PASSWORD}`
  })
  if (error) throw error
}

export const resetPasswordApi = async (data: ResetPasswordInput): Promise<void> => {
  const { error } = await createClient().auth.updateUser({ password: data.password })
  if (error) throw error
}

export const logoutApi = async (): Promise<void> => {
  const { error } = await createClient().auth.signOut()
  if (error) throw error
}
