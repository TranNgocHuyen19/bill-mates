import { z } from 'zod'

export const createExpenseDraftSchema = z.object({
  roomId: z.string().min(1, 'Vui lòng chọn phòng'),
  title: z.string().min(1, 'Tên khoản chi không được để trống').max(200, 'Tên khoản chi quá dài'),
  total_amount: z.number().positive('Số tiền phải lớn hơn 0'),
  paid_by_member_id: z.string().min(1, 'Vui lòng chọn người trả tiền'),
  expense_date: z.string().min(1, 'Vui lòng chọn ngày chi'),
  note: z.string().max(500, 'Ghi chú không quá 500 ký tự').optional()
})

export const splitEqualSchema = z.object({
  member_ids: z.array(z.string()).min(1, 'Chọn ít nhất 1 thành viên để chia')
})

export type CreateExpenseDraftSchemaInput = z.infer<typeof createExpenseDraftSchema>
export type SplitEqualSchemaInput = z.infer<typeof splitEqualSchema>
