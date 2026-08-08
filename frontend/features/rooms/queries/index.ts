'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getErrorMessage } from '@/lib/error-handler'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import {
  createCategoryApi,
  createInviteApi,
  createRoomApi,
  getCategoriesApi,
  getRoomDetailApi,
  getRoomsApi,
  joinRoomApi,
  leaveRoomApi,
  removeMemberApi,
  updateMemberRoleApi,
  type Category,
  type CreateRoomInput,
  type RoomRole
} from '../api'

export const roomKeys = {
  all: ['rooms'] as const,
  list: () => [...roomKeys.all, 'list'] as const,
  detail: (roomId: string) => [...roomKeys.all, roomId] as const,
  categories: (roomId: string) => [...roomKeys.detail(roomId), 'categories'] as const
}

export const useRoomsQuery = () =>
  useQuery({
    queryKey: roomKeys.list(),
    queryFn: getRoomsApi
  })

export const useRoomDetailQuery = (roomId: string) =>
  useQuery({
    queryKey: roomKeys.detail(roomId),
    queryFn: () => getRoomDetailApi(roomId),
    enabled: Boolean(roomId)
  })

export const useCategoriesQuery = (roomId: string) =>
  useQuery({
    queryKey: roomKeys.categories(roomId),
    queryFn: () => getCategoriesApi(roomId),
    enabled: Boolean(roomId)
  })

export const useCreateRoomMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRoomInput) => createRoomApi(data),
    onSuccess: (room) => {
      queryClient.setQueryData(roomKeys.list(), (rooms: unknown) => (Array.isArray(rooms) ? [room, ...rooms] : [room]))
      showSuccessToast('Đã tạo phòng mới.')
    },
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}

export const useCreateInviteMutation = (roomId: string) =>
  useMutation({
    mutationFn: () => createInviteApi(roomId),
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })

export const useJoinRoomMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: joinRoomApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roomKeys.all }),
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}

export const useCreateCategoryMutation = (roomId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Pick<Category, 'name' | 'icon' | 'color'>) => createCategoryApi(roomId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.categories(roomId) })
      showSuccessToast('Đã thêm danh mục.')
    },
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}

export const useUpdateMemberRoleMutation = (roomId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: RoomRole }) =>
      updateMemberRoleApi(roomId, memberId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roomKeys.detail(roomId) }),
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}

export const useRemoveMemberMutation = (roomId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => removeMemberApi(roomId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.detail(roomId) })
      showSuccessToast('Đã xóa thành viên khỏi phòng.')
    },
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}

export const useLeaveRoomMutation = (roomId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => leaveRoomApi(roomId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roomKeys.all }),
    onError: (error: unknown) => showErrorToast(getErrorMessage(error))
  })
}
