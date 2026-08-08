'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDebtsSummaryApi, settleDebtApi, type SettleDebtInput } from '../api'
import { showSuccessToast, showErrorToast } from '@/lib/toast'
import { getErrorMessage } from '@/lib/error-handler'

export const useDebtsSummaryQuery = (roomId: string = '101') => {
  return useQuery({
    queryKey: ['debts', roomId],
    queryFn: () => getDebtsSummaryApi(roomId)
  })
}

export const useSettleDebtMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SettleDebtInput) => settleDebtApi(data),
    onSuccess: () => {
      showSuccessToast('Đã gửi thông báo xác nhận thanh toán!')
      queryClient.invalidateQueries({ queryKey: ['debts'] })
    },
    onError: (error: unknown) => {
      showErrorToast(getErrorMessage(error) || 'Xác nhận thanh toán thất bại.')
    }
  })
}
