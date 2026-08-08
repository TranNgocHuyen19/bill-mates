'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PATHS } from '@/constants'
import { LoginSchema, LoginInput } from '../schemas'
import { useLoginMutation } from '../queries'

export function LoginForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const loginMutation = useLoginMutation()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = (data: LoginInput) => {
    loginMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center lg:text-left">
        <h2 className="text-2xl font-bold font-sans tracking-tight text-foreground">
          Chào mừng trở lại!
        </h2>
        <p className="text-sm text-muted-foreground">
          Đăng nhập để quản lý chi tiêu nhóm cùng các thành viên.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="name@example.com"
          disabled={loginMutation.isPending}
          icon={<Mail className="size-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Password Field */}
        <Input
          id="password"
          label={
            <div className="flex items-center justify-between w-full">
              <span>Mật khẩu</span>
              <Link
                href={PATHS.AUTH.FORGOT_PASSWORD}
                className="text-xs font-semibold text-primary hover:underline"
                tabIndex={-1}
              >
                Quên mật khẩu?
              </Link>
            </div>
          }
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          disabled={loginMutation.isPending}
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

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 text-sm font-semibold mt-2"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Đang đăng nhập...
            </>
          ) : (
            'Đăng nhập'
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground font-medium">Hoặc tiếp tục với</span>
        </div>
      </div>

      {/* Social Login */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 font-semibold text-sm gap-2"
        disabled={loginMutation.isPending}
        onClick={() => alert('Chức năng đang được tích hợp')}
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Đăng nhập với Google
      </Button>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground mt-4">
        Chưa có tài khoản?{' '}
        <Link href={PATHS.AUTH.REGISTER} className="font-semibold text-primary hover:underline">
          Đăng ký ngay
        </Link>
      </div>
    </div>
  )
}
