import http from '@/services/api'

export type RoomRole = 'owner' | 'admin' | 'member'
export type MembershipStatus = 'invited' | 'active' | 'left' | 'removed'

export interface RoomSummary {
  id: string
  name: string
  description: string | null
  currency: string
  role: RoomRole
  status: MembershipStatus
  member_count: number
  total_expenses: string
  archived_at: string | null
}

export interface RoomMember {
  id: string
  profile_id: string
  display_name: string
  email: string
  nickname: string | null
  role: RoomRole
  status: MembershipStatus
  joined_at: string | null
}

export interface RoomDetail extends RoomSummary {
  members: RoomMember[]
}

export interface CreateRoomInput {
  name: string
  description?: string
  currency?: string
}

export interface UpdateRoomInput {
  roomId: string
  name?: string
  description?: string | null
  currency?: string
}

export interface RoomInvite {
  id: string
  room_id: string
  token: string
  expires_at: string
  max_uses: number
  use_count: number
}

export interface Category {
  id: string
  room_id: string
  name: string
  icon: string | null
  color: string | null
  description: string | null
  is_active: boolean
}

export const getRoomsApi = async (): Promise<RoomSummary[]> => {
  const response = await http.get<RoomSummary[]>('/api/v1/rooms')
  return response.data
}

export const getRoomDetailApi = async (roomId: string): Promise<RoomDetail> => {
  const response = await http.get<RoomDetail>(`/api/v1/rooms/${roomId}`)
  return response.data
}

export const createRoomApi = async (data: CreateRoomInput): Promise<RoomSummary> => {
  const response = await http.post<RoomSummary>('/api/v1/rooms', data)
  return response.data
}

export const updateRoomApi = async ({ roomId, ...data }: UpdateRoomInput): Promise<RoomDetail> => {
  const response = await http.patch<RoomDetail>(`/api/v1/rooms/${roomId}`, data)
  return response.data
}

export const archiveRoomApi = async (roomId: string): Promise<void> => {
  await http.post(`/api/v1/rooms/${roomId}/archive`)
}

export const createInviteApi = async (roomId: string): Promise<RoomInvite> => {
  const response = await http.post<RoomInvite>(`/api/v1/rooms/${roomId}/invites`, {
    expires_in_hours: 72,
    max_uses: 10
  })
  return response.data
}

export const joinRoomApi = async (token: string): Promise<{ room_id: string; member_id: string; status: string }> => {
  const response = await http.post(`/api/v1/invites/${token}/join`)
  return response.data
}

export const getCategoriesApi = async (roomId: string): Promise<Category[]> => {
  const response = await http.get<Category[]>(`/api/v1/rooms/${roomId}/categories`)
  return response.data
}

export const createCategoryApi = async (
  roomId: string,
  data: Pick<Category, 'name' | 'icon' | 'color'>
): Promise<Category> => {
  const response = await http.post<Category>(`/api/v1/rooms/${roomId}/categories`, data)
  return response.data
}

export const updateMemberRoleApi = async (roomId: string, memberId: string, role: RoomRole): Promise<void> => {
  await http.patch(`/api/v1/rooms/${roomId}/members/${memberId}/role`, { role })
}

export const removeMemberApi = async (roomId: string, memberId: string): Promise<void> => {
  await http.delete(`/api/v1/rooms/${roomId}/members/${memberId}`)
}

export const leaveRoomApi = async (roomId: string): Promise<void> => {
  await http.post(`/api/v1/rooms/${roomId}/leave`)
}
