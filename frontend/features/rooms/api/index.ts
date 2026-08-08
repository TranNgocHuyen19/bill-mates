import http from '@/services/api'

export interface CreateRoomInput {
  name: string
  address?: string
}

export const getRoomsApi = async (): Promise<unknown> => {
  const response = await http.get('/api/v1/rooms')
  return response.data
}

export const getRoomDetailApi = async (roomId: string): Promise<unknown> => {
  const response = await http.get(`/api/v1/rooms/${roomId}`)
  return response.data
}

export const createRoomApi = async (data: CreateRoomInput): Promise<unknown> => {
  const response = await http.post('/api/v1/rooms', data)
  return response.data
}

export const addMemberApi = async (roomId: string, emailOrPhone: string): Promise<unknown> => {
  const response = await http.post(`/api/v1/rooms/${roomId}/members`, { email_or_phone: emailOrPhone })
  return response.data
}
