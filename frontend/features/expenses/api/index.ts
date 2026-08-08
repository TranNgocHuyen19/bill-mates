import http from '@/services/api'

export type ExpenseStatus = 'draft' | 'posted' | 'cancelled'
export type SplitMethod = 'equal' | 'exact' | 'percentage' | 'shares'

export interface ExpenseSplit {
  id: string
  member_id: string
  split_method: SplitMethod
  share_value: string | null
  amount_owed: string
}

export interface ExpenseItem {
  id: string
  name: string
  quantity: string
  unit_price: string
  total_amount: string
  category_id: string | null
  position: number
  splits: ExpenseSplit[]
}

export interface Expense {
  id: string
  room_id: string
  created_by_member_id: string
  paid_by_member_id: string
  title: string
  note: string | null
  total_amount: string
  expense_date: string
  status: ExpenseStatus
  posted_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
  items: ExpenseItem[]
}

export interface CreateExpenseDraftInput {
  roomId: string
  title: string
  total_amount: number
  paid_by_member_id: string
  expense_date: string
  note?: string
}

export interface AddExpenseItemInput {
  expenseId: string
  name: string
  quantity?: number
  unit_price: number
  category_id?: string | null
  position?: number
}

export interface SplitParticipantInput {
  member_id: string
  share_value?: number | null
}

export interface UpdateItemSplitsInput {
  itemId: string
  method: SplitMethod
  splits: SplitParticipantInput[]
}

export const getExpensesApi = async (roomId: string, status?: ExpenseStatus): Promise<Expense[]> => {
  const response = await http.get<Expense[]>(`/api/v1/rooms/${roomId}/expenses`, {
    params: { expense_status: status }
  })
  return response.data
}

export const getExpenseApi = async (expenseId: string): Promise<Expense> => {
  const response = await http.get<Expense>(`/api/v1/expenses/${expenseId}`)
  return response.data
}

export const createExpenseDraftApi = async ({ roomId, ...data }: CreateExpenseDraftInput): Promise<Expense> => {
  const response = await http.post<Expense>(`/api/v1/rooms/${roomId}/expenses`, data)
  return response.data
}

export const addExpenseItemApi = async ({ expenseId, ...data }: AddExpenseItemInput): Promise<ExpenseItem> => {
  const response = await http.post<ExpenseItem>(`/api/v1/expenses/${expenseId}/items`, {
    quantity: 1,
    position: 0,
    ...data
  })
  return response.data
}

export const updateItemSplitsApi = async ({ itemId, ...data }: UpdateItemSplitsInput): Promise<ExpenseSplit[]> => {
  const response = await http.put<ExpenseSplit[]>(`/api/v1/expense-items/${itemId}/splits`, data)
  return response.data
}

export const deleteExpenseItemApi = async (itemId: string): Promise<void> => {
  await http.delete(`/api/v1/expense-items/${itemId}`)
}

export const postExpenseApi = async (expenseId: string): Promise<Expense> => {
  const response = await http.post<Expense>(`/api/v1/expenses/${expenseId}/post`)
  return response.data
}

export const saveExpenseItemApi = async (
  item: AddExpenseItemInput,
  split: Omit<UpdateItemSplitsInput, 'itemId'>
): Promise<ExpenseItem> => {
  const created = await addExpenseItemApi(item)
  const splits = await updateItemSplitsApi({ itemId: created.id, ...split })
  return { ...created, splits }
}

export const uploadExpenseReceiptApi = async (expenseId: string, file: File): Promise<void> => {
  const formData = new FormData()
  formData.append('file', file)
  await http.post(`/api/v1/expenses/${expenseId}/receipts`, formData)
}
