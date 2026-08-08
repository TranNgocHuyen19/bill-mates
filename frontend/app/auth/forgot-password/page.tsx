import { ForgotPasswordForm, AuthLayout } from '@/features/auth'

export const metadata = {
  title: 'Quên mật khẩu - BillMates',
  description: 'Gửi yêu cầu đặt lại mật khẩu tài khoản BillMates'
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
