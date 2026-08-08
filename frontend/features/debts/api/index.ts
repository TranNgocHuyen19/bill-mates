import http from '@/services/api'

export interface SettleDebtInput {
  to_user_id: string
  amount: number
  payment_method?: string
}

export const getDebtsSummaryApi = async (roomId: string = '101'): Promise<unknown> => {
  const response = await http.get('/api/v1/debts', { params: { room_id: roomId } })
  return response.data
}

export const settleDebtApi = async (data: SettleDebtInput): Promise<unknown> => {
  const response = await http.post('/api/v1/debts/settle', data)
  return response.data
}
