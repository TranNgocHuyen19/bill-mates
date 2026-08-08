import type { Metadata } from 'next'

import { AuthLayout, LoginForm } from '@/features/auth'

export const metadata: Metadata = {
  title: 'Đăng nhập - Bill Mates',
  description: 'Đăng nhập để quản lý chi tiêu chung cùng Bill Mates.'
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  )
}
