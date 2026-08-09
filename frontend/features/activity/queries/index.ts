'use client'

import { useQuery } from '@tanstack/react-query'

import { getRoomActivityApi } from '../api'

export const activityKeys = {
  all: ['activity'] as const,
  room: (roomId: string, entityType?: string) => [...activityKeys.all, roomId, entityType ?? 'all'] as const
}

export const useRoomActivityQuery = (roomId: string, entityType?: string) =>
  useQuery({
    queryKey: activityKeys.room(roomId, entityType),
    queryFn: () => getRoomActivityApi(roomId, entityType),
    enabled: Boolean(roomId)
  })
