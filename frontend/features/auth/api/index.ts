import http from '@/services/api'
import { API_ENDPOINTS } from '@/services/endpoints'
import { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput } from '../schemas'

export interface AuthResponse {
  data: {
    accessToken: string
    // Add other properties if returned by the backend
  }
}

export const loginApi = async (data: LoginInput): Promise<AuthResponse> => {
  const response = await http.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, data)
  return response.data
}

export const registerApi = async (data: RegisterInput): Promise<unknown> => {
  const response = await http.post(API_ENDPOINTS.AUTH.REGISTER, data)
  return response.data
}

export const forgotPasswordApi = async (data: ForgotPasswordInput): Promise<unknown> => {
  // Simple simulation if endpoint doesn't exist, or actual request
  const response = await http.post('auth/forgot-password', data)
  return response.data
}

export const resetPasswordApi = async (data: ResetPasswordInput): Promise<unknown> => {
  const response = await http.post('auth/reset-password', data)
  return response.data
}
