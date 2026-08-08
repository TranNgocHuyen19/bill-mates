import http from '@/services/api'

export interface CreateExpenseInput {
  title: string
  amount: number
  payer_id: string
  split_type?: string
  room_id?: string
}

export const getExpensesApi = async (roomId: string = '101'): Promise<unknown> => {
  const response = await http.get('/api/v1/expenses', { params: { room_id: roomId } })
  return response.data
}

export const createExpenseApi = async (data: CreateExpenseInput): Promise<unknown> => {
  const response = await http.post('/api/v1/expenses', data)
  return response.data
}

export const scanBillOcrApi = async (file: File): Promise<unknown> => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await http.post('/api/v1/expenses/ocr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}
