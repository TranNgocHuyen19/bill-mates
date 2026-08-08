import http from '@/services/api'

export interface UpdateUserProfileInput {
  name?: string
  bank_name?: string
  account_number?: string
  account_name?: string
}

export const getMyProfileApi = async (): Promise<unknown> => {
  const response = await http.get('/api/v1/users/me')
  return response.data
}

export const updateMyProfileApi = async (data: UpdateUserProfileInput): Promise<unknown> => {
  const response = await http.put('/api/v1/users/me', data)
  return response.data
}
