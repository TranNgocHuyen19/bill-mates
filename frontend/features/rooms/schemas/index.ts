import { z } from 'zod'

export const createRoomSchema = z.object({
  name: z.string().min(2, 'Tên phòng phải có ít nhất 2 ký tự').max(100, 'Tên phòng không quá 100 ký tự'),
  description: z.string().max(500, 'Mô tả không quá 500 ký tự').optional(),
  currency: z.string().default('VND')
})

export const updateRoomSchema = z.object({
  name: z.string().min(2, 'Tên phòng phải có ít nhất 2 ký tự').max(100, 'Tên phòng không quá 100 ký tự').optional(),
  description: z.string().max(500, 'Mô tả không quá 500 ký tự').nullable().optional(),
  currency: z.string().optional()
})

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống').max(50, 'Tên danh mục quá dài'),
  icon: z.string().optional().default('shapes'),
  color: z.string().optional().default('#3f51b5')
})

export const inviteSchema = z.object({
  expires_in_hours: z.number().default(72),
  max_uses: z.number().default(10)
})

export type CreateRoomSchemaInput = z.infer<typeof createRoomSchema>
export type UpdateRoomSchemaInput = z.infer<typeof updateRoomSchema>
export type CreateCategorySchemaInput = z.infer<typeof createCategorySchema>
