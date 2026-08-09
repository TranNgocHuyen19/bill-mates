'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import { PATHS } from '@/constants'
import { getErrorMessage } from '@/lib/error-handler'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import { forgotPasswordApi, loginApi, logoutApi, registerApi, resetPasswordApi } from '../api'

export const useLoginMutation = (onSuccessCallback?: () => void) => {
  const router = useRouter()
  return useMutation({
    mutationFn: loginApi,
    onSuccess: () => {
      onSuccessCallback?.()
      showSuccessToast('Đăng nhập thành công!')
      router.replace(PATHS.ROOMS)
      router.refresh()
    },
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}

export const useRegisterMutation = () => {
  const router = useRouter()
  return useMutation({
    mutationFn: registerApi,
    onSuccess: ({ session }) => {
      if (session) {
        showSuccessToast('Tài khoản đã sẵn sàng!')
        router.replace(PATHS.ROOMS)
      } else {
        showSuccessToast('Đăng ký thành công. Hãy kiểm tra email để xác nhận tài khoản.')
        router.replace(PATHS.AUTH.LOGIN)
      }
      router.refresh()
    },
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}

export const useForgotPasswordMutation = () => {
  const router = useRouter()
  return useMutation({
    mutationFn: forgotPasswordApi,
    onSuccess: () => {
      showSuccessToast('Liên kết đặt lại mật khẩu đã được gửi.')
      router.replace(PATHS.AUTH.LOGIN)
    },
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}

export const useResetPasswordMutation = () => {
  const router = useRouter()
  return useMutation({
    mutationFn: resetPasswordApi,
    onSuccess: () => {
      showSuccessToast('Đặt lại mật khẩu thành công!')
      router.replace(PATHS.ROOMS)
    },
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}

export const useLogoutMutation = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logoutApi,
    onSettled: () => {
      queryClient.clear()
      router.replace(PATHS.AUTH.LOGIN)
      router.refresh()
    }
  })
}
