'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RegisterSchema, RegisterInput } from '../schemas'
import { useRegisterMutation } from '../queries'

export function RegisterForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const registerMutation = useRegisterMutation()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  })

  const onSubmit = (data: RegisterInput) => {
    registerMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center lg:text-left">
        <h2 className="text-2xl font-bold font-sans tracking-tight text-foreground">
          Đăng ký tài khoản
        </h2>
        <p className="text-sm text-muted-foreground">
          Tham gia BillMates để chia sẻ chi tiêu phòng, nhóm dễ dàng.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Field */}
        <Input
          id="name"
          label="Họ và tên"
          type="text"
          placeholder="Nguyễn Văn A"
          disabled={registerMutation.isPending}
          icon={<User className="size-4" />}
          error={errors.name?.message}
          {...register('name')}
        />

        {/* Email Field */}
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="name@example.com"
          disabled={registerMutation.isPending}
          icon={<Mail className="size-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Password Field */}
        <Input
          id="password"
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          disabled={registerMutation.isPending}
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
          label="Xác nhận mật khẩu"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="••••••••"
          disabled={registerMutation.isPending}
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
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Đang tạo tài khoản...
            </>
          ) : (
            'Đăng ký tài khoản'
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground mt-4">
        Đã có tài khoản?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  )
}
