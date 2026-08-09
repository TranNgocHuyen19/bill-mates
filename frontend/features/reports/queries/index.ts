'use client'

import { useMutation, useQuery } from '@tanstack/react-query'

import { getErrorMessage } from '@/lib/error-handler'
import { showErrorToast } from '@/lib/toast'
import { exportExpenseReportApi, getExpenseReportApi } from '../api'
import type { ReportFilters } from '../schemas'

export const reportKeys = {
  all: ['reports'] as const,
  room: (roomId: string) => [...reportKeys.all, 'room', roomId] as const,
  detail: ({ roomId, fromDate, toDate }: ReportFilters) => [...reportKeys.room(roomId), { fromDate, toDate }] as const
}

export function useExpenseReportQuery(filters: ReportFilters) {
  return useQuery({
    queryKey: reportKeys.detail(filters),
    queryFn: ({ signal }) => getExpenseReportApi(filters, signal),
    enabled: Boolean(filters.roomId && filters.fromDate && filters.toDate),
    staleTime: 60_000,
    retry: 1
  })
}

export function useExportExpenseReportMutation() {
  return useMutation({
    mutationFn: exportExpenseReportApi,
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}
