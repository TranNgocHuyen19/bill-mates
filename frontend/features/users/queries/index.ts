'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyProfileApi, updateMyProfileApi, type UpdateUserProfileInput } from '../api'
import { showSuccessToast, showErrorToast } from '@/lib/toast'
import { getErrorMessage } from '@/lib/error-handler'

export const useMyProfileQuery = () => {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: getMyProfileApi
  })
}

export const useUpdateMyProfileMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateUserProfileInput) => updateMyProfileApi(data),
    onSuccess: () => {
      showSuccessToast('Cập nhật thông tin thành công!')
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
    },
    onError: (error: unknown) => {
      showErrorToast(getErrorMessage(error) || 'Cập nhật thông tin thất bại.')
    }
  })
}
