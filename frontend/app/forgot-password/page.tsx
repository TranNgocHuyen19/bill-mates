import { ForgotPasswordForm, AuthLayout } from '@/features/auth'

export const metadata = {
  title: 'Quên mật khẩu - BillMates',
  description: 'Yêu cầu liên kết đặt lại mật khẩu của bạn'
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
