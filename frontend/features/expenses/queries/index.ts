'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getErrorMessage } from '@/lib/error-handler'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import {
  cancelExpenseApi,
  createExpenseDraftApi,
  deleteExpenseItemApi,
  getExpenseApi,
  getExpensesApi,
  postExpenseApi,
  saveExpenseItemApi,
  type AddExpenseItemInput,
  type CreateExpenseDraftInput,
  type ExpenseStatus,
  type UpdateItemSplitsInput
} from '../api'

export const expenseKeys = {
  all: ['expenses'] as const,
  roomScope: (roomId: string) => [...expenseKeys.all, 'room', roomId] as const,
  room: (roomId: string, status?: ExpenseStatus) => [...expenseKeys.roomScope(roomId), status ?? 'all'] as const,
  detail: (expenseId: string) => [...expenseKeys.all, expenseId] as const
}

export const useExpensesQuery = (roomId: string, status?: ExpenseStatus) =>
  useQuery({
    queryKey: expenseKeys.room(roomId, status),
    queryFn: () => getExpensesApi(roomId, status),
    enabled: Boolean(roomId)
  })

export const useExpenseQuery = (expenseId: string) =>
  useQuery({
    queryKey: expenseKeys.detail(expenseId),
    queryFn: () => getExpenseApi(expenseId),
    enabled: Boolean(expenseId)
  })

export const useCreateExpenseDraftMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateExpenseDraftInput) => createExpenseDraftApi(data),
    onSuccess: (expense) => {
      queryClient.setQueryData(expenseKeys.detail(expense.id), expense)
      queryClient.invalidateQueries({ queryKey: expenseKeys.roomScope(expense.room_id) })
      showSuccessToast('Đã lưu đơn nháp.')
    },
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}

export const useSaveExpenseItemMutation = (expenseId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ item, split }: { item: AddExpenseItemInput; split: Omit<UpdateItemSplitsInput, 'itemId'> }) =>
      saveExpenseItemApi(item, split),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(expenseId) })
      showSuccessToast('Đã thêm món và phần chia.')
    },
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}

export const useDeleteExpenseItemMutation = (expenseId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteExpenseItemApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expenseKeys.detail(expenseId) }),
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}

export const usePostExpenseMutation = (expenseId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => postExpenseApi(expenseId),
    onSuccess: (expense) => {
      queryClient.setQueryData(expenseKeys.detail(expenseId), expense)
      queryClient.invalidateQueries({ queryKey: expenseKeys.roomScope(expense.room_id) })
      showSuccessToast('Khoản chi đã được chốt và tính vào công nợ.')
    },
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}

export const useCancelExpenseMutation = (roomId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelExpenseApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.roomScope(roomId) })
      showSuccessToast('Đã bỏ đơn nháp.')
    },
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}
