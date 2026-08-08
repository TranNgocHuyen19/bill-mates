'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getExpensesApi, createExpenseApi, scanBillOcrApi, type CreateExpenseInput } from '../api'
import { showSuccessToast, showErrorToast } from '@/lib/toast'
import { getErrorMessage } from '@/lib/error-handler'

export const useExpensesQuery = (roomId: string = '101') => {
  return useQuery({
    queryKey: ['expenses', roomId],
    queryFn: () => getExpensesApi(roomId)
  })
}

export const useCreateExpenseMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateExpenseInput) => createExpenseApi(data),
    onSuccess: () => {
      showSuccessToast('Đã thêm khoản chi mới thành công!')
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
    onError: (error: unknown) => {
      showErrorToast(getErrorMessage(error) || 'Thêm khoản chi thất bại.')
    }
  })
}

export const useScanOcrMutation = () => {
  return useMutation({
    mutationFn: (file: File) => scanBillOcrApi(file),
    onSuccess: () => {
      showSuccessToast('Quét hóa đơn AI thành công!')
    },
    onError: (error: unknown) => {
      showErrorToast(getErrorMessage(error) || 'Quét hóa đơn AI thất bại.')
    }
  })
}
