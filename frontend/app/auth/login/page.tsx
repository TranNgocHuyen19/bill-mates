import { LoginForm, AuthLayout } from '@/features/auth'

export const metadata = {
  title: 'Đăng nhập - BillMates',
  description: 'Đăng nhập vào tài khoản BillMates của bạn'
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  )
}
