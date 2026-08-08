'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRoomsApi, getRoomDetailApi, createRoomApi, addMemberApi, type CreateRoomInput } from '../api'
import { showSuccessToast, showErrorToast } from '@/lib/toast'
import { getErrorMessage } from '@/lib/error-handler'

export const ROOMS_QUERY_KEY = ['rooms']

export const useRoomsQuery = () => {
  return useQuery({
    queryKey: ROOMS_QUERY_KEY,
    queryFn: getRoomsApi
  })
}

export const useRoomDetailQuery = (roomId: string) => {
  return useQuery({
    queryKey: ['room', roomId],
    queryFn: () => getRoomDetailApi(roomId),
    enabled: !!roomId
  })
}

export const useCreateRoomMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRoomInput) => createRoomApi(data),
    onSuccess: () => {
      showSuccessToast('Tạo phòng trọ mới thành công!')
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY })
    },
    onError: (error: unknown) => {
      showErrorToast(getErrorMessage(error) || 'Tạo phòng thất bại. Vui lòng thử lại.')
    }
  })
}

export const useAddMemberMutation = (roomId: string) => {
  return useMutation({
    mutationFn: (emailOrPhone: string) => addMemberApi(roomId, emailOrPhone),
    onSuccess: () => {
      showSuccessToast('Đã gửi lời mời tham gia phòng!')
    },
    onError: (error: unknown) => {
      showErrorToast(getErrorMessage(error) || 'Gửi lời mời thất bại.')
    }
  })
}
