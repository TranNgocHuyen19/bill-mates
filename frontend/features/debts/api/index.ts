import http from '@/services/api'

export type SettlementStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled'
export type SettlementMethod = 'bank_transfer' | 'cash' | 'e_wallet' | 'other'

export interface PaymentAccountSummary {
  id: string
  label: string
  method: string
  bank_code: string | null
  bank_name: string | null
  account_number: string | null
  account_name: string | null
  wallet_provider: string | null
}

export interface MemberBalance {
  member_id: string
  profile_id: string
  display_name: string
  balance: string
  paid: string
  owed: string
  settlements_sent: string
  settlements_received: string
}

export interface SettlementSuggestion {
  from_member_id: string
  from_name: string
  to_member_id: string
  to_name: string
  amount: string
  payment_account: PaymentAccountSummary | null
}

export interface BalanceSummary {
  room_id: string
  current_member_id: string
  current_balance: string
  total_to_pay: string
  total_to_receive: string
  balances: MemberBalance[]
  suggestions: SettlementSuggestion[]
}

export interface Settlement {
  id: string
  room_id: string
  from_member_id: string
  from_name: string
  to_member_id: string
  to_name: string
  payment_account: PaymentAccountSummary | null
  amount: string
  method: SettlementMethod
  status: SettlementStatus
  reference: string | null
  note: string | null
  rejection_reason: string | null
  confirmed_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateSettlementInput {
  roomId: string
  to_member_id: string
  amount: number
  method: SettlementMethod
  payment_account_id?: string | null
  reference?: string
  note?: string
}

export const getBalancesApi = async (roomId: string): Promise<BalanceSummary> => {
  const response = await http.get<BalanceSummary>(`/api/v1/rooms/${roomId}/balances`)
  return response.data
}

export const getSettlementsApi = async (roomId: string): Promise<Settlement[]> => {
  const response = await http.get<Settlement[]>(`/api/v1/rooms/${roomId}/settlements`)
  return response.data
}

export const createSettlementApi = async ({ roomId, ...data }: CreateSettlementInput): Promise<Settlement> => {
  const response = await http.post<Settlement>(`/api/v1/rooms/${roomId}/settlements`, data)
  return response.data
}

export const uploadSettlementReceiptApi = async (settlementId: string, receipt: File): Promise<void> => {
  const formData = new FormData()
  formData.append('file', receipt)
  await http.post(`/api/v1/settlements/${settlementId}/receipts`, formData)
}

export const confirmSettlementApi = async (settlementId: string): Promise<Settlement> => {
  const response = await http.post<Settlement>(`/api/v1/settlements/${settlementId}/confirm`)
  return response.data
}

export const rejectSettlementApi = async ({
  settlementId,
  reason
}: {
  settlementId: string
  reason: string
}): Promise<Settlement> => {
  const response = await http.post<Settlement>(`/api/v1/settlements/${settlementId}/reject`, { reason })
  return response.data
}

export const cancelSettlementApi = async (settlementId: string): Promise<void> => {
  await http.post(`/api/v1/settlements/${settlementId}/cancel`)
}
