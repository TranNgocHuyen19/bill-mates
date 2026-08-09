import { z } from 'zod'

export const settleDebtSchema = z.object({
  roomId: z.string().min(1, 'Mã phòng không hợp lệ'),
  to_member_id: z.string().min(1, 'Chọn thành viên nhận tiền'),
  amount: z.number().positive('Số tiền phải lớn hơn 0'),
  method: z.enum(['cash', 'bank_transfer', 'other']).default('bank_transfer'),
  payment_account_id: z.string().optional(),
  reference: z.string().optional()
})

export type SettleDebtInput = z.infer<typeof settleDebtSchema>
