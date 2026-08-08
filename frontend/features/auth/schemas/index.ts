import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
})

export type LoginInput = z.infer<typeof LoginSchema>

export const RegisterSchema = z
  .object({
    name: z.string().trim().min(2, 'Tên phải có ít nhất 2 ký tự').max(128),
    email: z.email('Email không đúng định dạng'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không trùng khớp',
    path: ['confirmPassword']
  })

export type RegisterInput = z.infer<typeof RegisterSchema>

export const ForgotPasswordSchema = z.object({
  email: z.email('Email không đúng định dạng')
})

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>

export const ResetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không trùng khớp',
    path: ['confirmPassword']
  })

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>
