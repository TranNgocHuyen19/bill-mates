import type { Metadata } from 'next'

import { AuthLayout, ResetPasswordForm } from '@/features/auth'

export const metadata: Metadata = {
  title: 'Đặt lại mật khẩu - Bill Mates',
  description: 'Đặt mật khẩu mới cho tài khoản Bill Mates.'
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  )
}
