import http from '@/services/api'

export interface UserProfile {
  id: string
  display_name: string
  email: string
  phone: string | null
  avatar_path: string | null
  created_at: string
  updated_at: string
}

export interface UpdateUserProfileInput {
  display_name?: string
  phone?: string | null
  avatar_path?: string | null
}

export interface PaymentAccount {
  id: string
  label: string
  method: 'bank_transfer' | 'cash' | 'e_wallet' | 'other'
  bank_code: string | null
  bank_name: string | null
  account_number: string | null
  account_name: string | null
  wallet_provider: string | null
  is_default: boolean
}

export interface CreatePaymentAccountInput {
  label: string
  method: PaymentAccount['method']
  bank_code?: string
  bank_name?: string
  account_number?: string
  account_name?: string
  wallet_provider?: string
  is_default?: boolean
}

export const getMyProfileApi = async (): Promise<UserProfile> => {
  const response = await http.get<UserProfile>('/api/v1/me')
  return response.data
}

export const updateMyProfileApi = async (data: UpdateUserProfileInput): Promise<UserProfile> => {
  const response = await http.patch<UserProfile>('/api/v1/me', data)
  return response.data
}

export const getPaymentAccountsApi = async (): Promise<PaymentAccount[]> => {
  const response = await http.get<PaymentAccount[]>('/api/v1/me/payment-accounts')
  return response.data
}

export const createPaymentAccountApi = async (data: CreatePaymentAccountInput): Promise<PaymentAccount> => {
  const response = await http.post<PaymentAccount>('/api/v1/me/payment-accounts', data)
  return response.data
}
