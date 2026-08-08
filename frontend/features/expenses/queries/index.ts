'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getErrorMessage } from '@/lib/error-handler'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import {
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
  room: (roomId: string, status?: ExpenseStatus) => [...expenseKeys.all, 'room', roomId, status ?? 'all'] as const,
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

export const useCreateExpenseDraftMutation = () =>
  useMutation({
    mutationFn: (data: CreateExpenseDraftInput) => createExpenseDraftApi(data),
    onSuccess: () => showSuccessToast('Đã lưu đơn nháp.'),
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })

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
      queryClient.invalidateQueries({ queryKey: expenseKeys.room(expense.room_id) })
      showSuccessToast('Khoản chi đã được chốt và tính vào công nợ.')
    },
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}
