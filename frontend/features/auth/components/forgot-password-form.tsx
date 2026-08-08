'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ForgotPasswordSchema, ForgotPasswordInput } from '../schemas'
import { useForgotPasswordMutation } from '../queries'

export function ForgotPasswordForm() {
  const forgotPasswordMutation = useForgotPasswordMutation()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  })

  const onSubmit = (data: ForgotPasswordInput) => {
    forgotPasswordMutation.mutate(data)
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
          Quên mật khẩu?
        </h2>
        <p className="text-sm text-muted-foreground">
          Nhập email của bạn và chúng tôi sẽ gửi liên kết để đặt lại mật khẩu mới.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <Input
          id="email"
          label="Email của bạn"
          type="email"
          placeholder="name@example.com"
          disabled={forgotPasswordMutation.isPending}
          icon={<Mail className="size-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 text-sm font-semibold mt-4"
          disabled={forgotPasswordMutation.isPending}
        >
          {forgotPasswordMutation.isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Đang gửi yêu cầu...
            </>
          ) : (
            'Gửi liên kết đặt lại mật khẩu'
          )}
        </Button>
      </form>
    </div>
  )
}
