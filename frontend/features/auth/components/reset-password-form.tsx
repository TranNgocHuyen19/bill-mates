'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ResetPasswordSchema, ResetPasswordInput } from '../schemas'
import { useResetPasswordMutation } from '../queries'

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const resetPasswordMutation = useResetPasswordMutation()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  })

  const onSubmit = (data: ResetPasswordInput) => {
    resetPasswordMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      {/* Back to Login Link */}
      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Quay lại đăng nhập
      </Link>

      {/* Header */}
      <div className="space-y-2 text-center lg:text-left">
        <h2 className="text-2xl font-bold font-sans tracking-tight text-foreground">
          Đặt lại mật khẩu mới
        </h2>
        <p className="text-sm text-muted-foreground">
          Mật khẩu mới của bạn phải khác mật khẩu đã sử dụng trước đây.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Password Field */}
        <Input
          id="password"
          label="Mật khẩu mới"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          disabled={resetPasswordMutation.isPending}
          icon={<Lock className="size-4" />}
          trailingIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
          error={errors.password?.message}
          {...register('password')}
        />

        {/* Confirm Password Field */}
        <Input
          id="confirmPassword"
          label="Xác nhận mật khẩu mới"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="••••••••"
          disabled={resetPasswordMutation.isPending}
          icon={<Lock className="size-4" />}
          trailingIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 text-sm font-semibold mt-4"
          disabled={resetPasswordMutation.isPending}
        >
          {resetPasswordMutation.isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Đang cập nhật...
            </>
          ) : (
            'Cập nhật mật khẩu'
          )}
        </Button>
      </form>
    </div>
  )
}
