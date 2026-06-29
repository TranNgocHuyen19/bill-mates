import { ResetPasswordForm, AuthLayout } from '@/features/auth'

export const metadata = {
  title: 'Đặt lại mật khẩu - BillMates',
  description: 'Đặt lại mật khẩu mới cho tài khoản BillMates của bạn'
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  )
}
