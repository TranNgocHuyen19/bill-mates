import { RegisterForm, AuthLayout } from '@/features/auth'

export const metadata = {
  title: 'Đăng ký tài khoản - BillMates',
  description: 'Tạo tài khoản BillMates mới để quản lý chi tiêu nhóm'
}

export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  )
}
