import { z } from 'zod'

export const updateProfileSchema = z.object({
  display_name: z.string().min(2, 'Tên hiển thị phải có ít nhất 2 ký tự').max(100, 'Tên hiển thị không quá 100 ký tự'),
  phone: z.string().nullable().optional()
})

export const createPaymentAccountSchema = z.object({
  label: z.string().min(1, 'Tên gợi nhớ không được để trống'),
  method: z.string().default('bank_transfer'),
  bank_name: z.string().min(1, 'Vui lòng chọn/nhập ngân hàng'),
  bank_code: z.string().optional(),
  account_number: z.string().min(1, 'Số tài khoản không được để trống'),
  account_name: z.string().min(1, 'Tên chủ tài khoản không được để trống'),
  is_default: z.boolean().default(true)
})

export type UpdateProfileSchemaInput = z.infer<typeof updateProfileSchema>
export type CreatePaymentAccountSchemaInput = z.infer<typeof createPaymentAccountSchema>
