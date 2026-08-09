import http from '@/services/api'

export interface Activity {
  id: string
  room_id: string
  actor_profile_id: string | null
  actor_name: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  created_at: string
}

export const getRoomActivityApi = async (roomId: string, entityType?: string): Promise<Activity[]> => {
  const response = await http.get<Activity[]>(`/api/v1/rooms/${roomId}/activity`, {
    params: { entity_type: entityType || undefined, limit: 100 }
  })
  return response.data
}
