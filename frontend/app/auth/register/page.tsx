import type { Metadata } from 'next'

import { AuthLayout, RegisterForm } from '@/features/auth'

export const metadata: Metadata = {
  title: 'Đăng ký - Bill Mates',
  description: 'Tạo tài khoản Bill Mates để bắt đầu chia chi phí.'
}

export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  )
}
