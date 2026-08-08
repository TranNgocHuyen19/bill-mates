'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getErrorMessage } from '@/lib/error-handler'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import {
  cancelSettlementApi,
  confirmSettlementApi,
  createSettlementApi,
  getBalancesApi,
  getSettlementsApi,
  rejectSettlementApi,
  type CreateSettlementInput
} from '../api'

export const debtKeys = {
  all: ['debts'] as const,
  balances: (roomId: string) => [...debtKeys.all, roomId, 'balances'] as const,
  settlements: (roomId: string) => [...debtKeys.all, roomId, 'settlements'] as const
}

export const useBalancesQuery = (roomId: string) =>
  useQuery({
    queryKey: debtKeys.balances(roomId),
    queryFn: () => getBalancesApi(roomId),
    enabled: Boolean(roomId)
  })

export const useSettlementsQuery = (roomId: string) =>
  useQuery({
    queryKey: debtKeys.settlements(roomId),
    queryFn: () => getSettlementsApi(roomId),
    enabled: Boolean(roomId)
  })

const useInvalidateDebts = (roomId: string) => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: [...debtKeys.all, roomId] })
}

export const useCreateSettlementMutation = (roomId: string) => {
  const invalidate = useInvalidateDebts(roomId)
  return useMutation({
    mutationFn: (data: CreateSettlementInput) => createSettlementApi(data),
    onSuccess: () => {
      invalidate()
      showSuccessToast('Đã gửi yêu cầu xác nhận thanh toán.')
    },
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}

export const useConfirmSettlementMutation = (roomId: string) => {
  const invalidate = useInvalidateDebts(roomId)
  return useMutation({
    mutationFn: confirmSettlementApi,
    onSuccess: () => {
      invalidate()
      showSuccessToast('Đã xác nhận nhận tiền.')
    },
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}

export const useRejectSettlementMutation = (roomId: string) => {
  const invalidate = useInvalidateDebts(roomId)
  return useMutation({
    mutationFn: rejectSettlementApi,
    onSuccess: () => invalidate(),
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}

export const useCancelSettlementMutation = (roomId: string) => {
  const invalidate = useInvalidateDebts(roomId)
  return useMutation({
    mutationFn: cancelSettlementApi,
    onSuccess: () => invalidate(),
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}
