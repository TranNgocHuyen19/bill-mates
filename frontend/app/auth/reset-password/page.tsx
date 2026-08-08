import { ResetPasswordForm, AuthLayout } from '@/features/auth'

export const metadata = {
  title: 'Đặt lại mật khẩu - BillMates',
  description: 'Nhập mật khẩu mới cho tài khoản BillMates'
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  )
}
