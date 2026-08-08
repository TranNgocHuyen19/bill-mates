'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { loginApi, registerApi, forgotPasswordApi, resetPasswordApi, logoutApi } from '../api'
import { setAccessToken, clearAccessToken } from '@/services/api'
import { showSuccessToast, showErrorToast } from '@/lib/toast'
import { getErrorMessage } from '@/lib/error-handler'
import { PATHS } from '@/constants'

export const useLoginMutation = () => {
  const router = useRouter()
  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      const token = data.data?.accessToken
      if (token) {
        setAccessToken(token)
      }
      showSuccessToast('Đăng nhập thành công!')
      router.push(PATHS.HOME)
      router.refresh()
    },
    onError: (error: unknown) => {
      showErrorToast(getErrorMessage(error) || 'Đăng nhập thất bại. Vui lòng thử lại.')
    }
  })
}

export const useRegisterMutation = () => {
  const router = useRouter()
  return useMutation({
    mutationFn: registerApi,
    onSuccess: () => {
      showSuccessToast('Đăng ký tài khoản thành công! Vui lòng đăng nhập.')
      router.push(PATHS.AUTH.LOGIN)
    },
    onError: (error: unknown) => {
      showErrorToast(getErrorMessage(error) || 'Đăng ký thất bại. Vui lòng thử lại.')
    }
  })
}

export const useForgotPasswordMutation = () => {
  const router = useRouter()
  return useMutation({
    mutationFn: forgotPasswordApi,
    onSuccess: () => {
      showSuccessToast('Liên kết đặt lại mật khẩu đã được gửi đến email của bạn!')
      router.push(PATHS.AUTH.LOGIN)
    },
    onError: (error: unknown) => {
      showErrorToast(getErrorMessage(error) || 'Gửi yêu cầu thất bại. Vui lòng thử lại.')
    }
  })
}

export const useResetPasswordMutation = () => {
  const router = useRouter()
  return useMutation({
    mutationFn: resetPasswordApi,
    onSuccess: () => {
      showSuccessToast('Đặt lại mật khẩu thành công!')
      router.push(PATHS.AUTH.LOGIN)
    },
    onError: (error: unknown) => {
      showErrorToast(getErrorMessage(error) || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.')
    }
  })
}

export const useLogoutMutation = () => {
  const router = useRouter()
  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      clearAccessToken()
      showSuccessToast('Đã đăng xuất thành công!')
      router.push(PATHS.AUTH.LOGIN)
      router.refresh()
    },
    onError: (error: unknown) => {
      clearAccessToken()
      showErrorToast(getErrorMessage(error) || 'Đăng xuất thất bại.')
      router.push(PATHS.AUTH.LOGIN)
    }
  })
}

