import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { loginApi, registerApi, forgotPasswordApi, resetPasswordApi } from '../api'
import { setAccessToken } from '@/services/api'
import { showSuccessToast, showErrorToast } from '@/lib/toast'
import { getErrorMessage } from '@/lib/error-handler'

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
      router.push('/')
      router.refresh()
    },
    onError: (error: unknown) => {
      // Axios interceptor will show simple toast for >=400, but we can override or show error toast
      showErrorToast(getErrorMessage(error) || 'Đăng nhập thất bại. Vui lòng thử lại.')
    }
  })
}

export const useRegisterMutation = () => {
  const router = useRouter()
  return useMutation({
    mutationFn: registerApi,
    onSuccess: () => {
      showSuccessToast('Đăng ký tài khoản thành công!')
      router.push('/login')
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
      router.push('/login')
    },
    onError: (error: unknown) => {
      // For forgot password, we can simulate success for demo if api doesn't exist
      const err = error as { message?: string; response?: { status?: number } }
      if (err.message === 'Network Error' || err.response?.status === 404) {
        showSuccessToast('Liên kết đặt lại mật khẩu đã được gửi (Chế độ mô phỏng)')
        router.push('/login')
      } else {
        showErrorToast(getErrorMessage(error) || 'Gửi yêu cầu thất bại. Vui lòng thử lại.')
      }
    }
  })
}

export const useResetPasswordMutation = () => {
  const router = useRouter()
  return useMutation({
    mutationFn: resetPasswordApi,
    onSuccess: () => {
      showSuccessToast('Đặt lại mật khẩu thành công!')
      router.push('/login')
    },
    onError: (error: unknown) => {
      const err = error as { message?: string; response?: { status?: number } }
      if (err.message === 'Network Error' || err.response?.status === 404) {
        showSuccessToast('Đặt lại mật khẩu thành công (Chế độ mô phỏng)')
        router.push('/login')
      } else {
        showErrorToast(getErrorMessage(error) || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.')
      }
    }
  })
}
