import { toast } from 'sonner'

export const showSuccessToast = (message: string, duration: number = 2000) => {
  toast.success(message, { duration })
}

export const showErrorToast = (message: string, duration: number = 2000) => {
  toast.error(message, { duration })
}

export const showLoadingToast = (message: string) => {
  return toast.loading(message)
}

export const showWarningToast = (message: string, duration: number = 2000) => {
  toast.warning(message, { duration })
}

export const showSimpleToast = (message: string, duration: number = 1500) => {
  toast(message, { duration })
}
