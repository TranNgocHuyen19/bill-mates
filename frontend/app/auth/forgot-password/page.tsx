import type { Metadata } from 'next'

import { AuthLayout, ForgotPasswordForm } from '@/features/auth'

export const metadata: Metadata = {
  title: 'Quên mật khẩu - Bill Mates',
  description: 'Nhận liên kết khôi phục tài khoản Bill Mates.'
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
