export interface ReportFilters {
  roomId: string
  fromDate: string
  toDate: string
}

export interface ReportSummary {
  posted_expense_count: number
  total_expenses: string
  member_count: number
  confirmed_settlement_count: number
  confirmed_settlement_amount: string
}

export interface MonthlyReport {
  month: string
  expense_count: number
  total: string
}

export interface CategoryReport {
  category_id: string | null
  name: string
  color: string | null
  total: string
}

export interface MemberReport {
  member_id: string
  display_name: string
  paid: string
  owed: string
  settlements_sent: string
  settlements_received: string
  balance: string
}

export type ReportSettlementStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled'
export type ReportSettlementMethod = 'bank_transfer' | 'cash' | 'e_wallet' | 'other'
export type ReportSplitMethod = 'equal' | 'exact' | 'percentage' | 'shares'

export interface ReportExpense {
  expense_id: string
  expense_date: string
  title: string
  payer_member_id: string
  payer_name: string
  total: string
  note: string | null
  posted_at: string | null
}

export interface ReportItem {
  expense_id: string
  expense_date: string
  item_id: string
  position: number
  name: string
  category_id: string | null
  category_name: string
  quantity: string
  unit_price: string
  total: string
}

export interface ReportSplit {
  expense_id: string
  item_id: string
  item_name: string
  member_id: string
  member_name: string
  split_method: ReportSplitMethod
  share_value: string | null
  amount_owed: string
}

export interface ReportSettlement {
  settlement_id: string
  created_at: string
  confirmed_at: string | null
  from_member_id: string
  from_name: string
  to_member_id: string
  to_name: string
  amount: string
  method: ReportSettlementMethod
  status: ReportSettlementStatus
  reference: string | null
  note: string | null
}

export interface RoomReport {
  room_id: string
  room_name: string
  currency: string
  from_date: string
  to_date: string
  timezone: string
  generated_at: string
  summary: ReportSummary
  monthly: MonthlyReport[]
  categories: CategoryReport[]
  members: MemberReport[]
  expenses: ReportExpense[]
  items: ReportItem[]
  splits: ReportSplit[]
  settlements: ReportSettlement[]
}

export interface ReportExport {
  blob: Blob
  filename: string
}
