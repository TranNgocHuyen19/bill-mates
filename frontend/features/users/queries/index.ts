'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getErrorMessage } from '@/lib/error-handler'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import {
  createPaymentAccountApi,
  getMyProfileApi,
  getPaymentAccountsApi,
  updateMyProfileApi,
  type CreatePaymentAccountInput,
  type UpdateUserProfileInput
} from '../api'

export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  paymentAccounts: () => [...userKeys.all, 'payment-accounts'] as const
}

export const useMyProfileQuery = () =>
  useQuery({
    queryKey: userKeys.profile(),
    queryFn: getMyProfileApi
  })

export const usePaymentAccountsQuery = () =>
  useQuery({
    queryKey: userKeys.paymentAccounts(),
    queryFn: getPaymentAccountsApi
  })

export const useUpdateMyProfileMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateUserProfileInput) => updateMyProfileApi(data),
    onSuccess: (profile) => {
      queryClient.setQueryData(userKeys.profile(), profile)
      showSuccessToast('Đã cập nhật hồ sơ.')
    },
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}

export const useCreatePaymentAccountMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePaymentAccountInput) => createPaymentAccountApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.paymentAccounts() })
      showSuccessToast('Đã lưu tài khoản nhận tiền.')
    },
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}
