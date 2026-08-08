'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PATHS } from '@/constants'
import { useGoogleLoginMutation, useLoginMutation } from '../queries'
import { LoginSchema, type LoginInput } from '../schemas'

export function LoginForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const loginMutation = useLoginMutation()
  const googleMutation = useGoogleLoginMutation()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' }
  })

  return (
    <div className='space-y-6'>
      <header>
        <p className='text-sm font-semibold text-primary'>Chào mừng trở lại</p>
        <h2 className='mt-1 text-2xl font-bold tracking-tight'>Đăng nhập Bill Mates</h2>
        <p className='mt-2 text-sm leading-6 text-muted-foreground'>
          Mọi khoản chi của phòng được đồng bộ ngay sau khi bạn đăng nhập.
        </p>
      </header>

      <form className='space-y-4' onSubmit={handleSubmit((data) => loginMutation.mutate(data))}>
        <Input
          id='email'
          type='email'
          autoComplete='email'
          label='Email'
          placeholder='ban@example.com'
          icon={<Mail className='size-4' />}
          error={errors.email?.message}
          disabled={loginMutation.isPending}
          {...register('email')}
        />
        <Input
          id='password'
          type={showPassword ? 'text' : 'password'}
          autoComplete='current-password'
          label={
            <span className='flex w-full items-center justify-between'>
              Mật khẩu
              <Link className='text-xs font-semibold text-primary' href={PATHS.AUTH.FORGOT_PASSWORD}>
                Quên mật khẩu?
              </Link>
            </span>
          }
          placeholder='••••••••'
          icon={<LockKeyhole className='size-4' />}
          trailingIcon={
            <button
              type='button'
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
            </button>
          }
          error={errors.password?.message}
          disabled={loginMutation.isPending}
          {...register('password')}
        />
        <Button className='h-12 w-full rounded-xl font-semibold' disabled={loginMutation.isPending}>
          {loginMutation.isPending && <Loader2 className='size-4 animate-spin' />}
          {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>

      <div className='flex items-center gap-3 text-xs text-muted-foreground'>
        <span className='h-px flex-1 bg-border' />
        hoặc
        <span className='h-px flex-1 bg-border' />
      </div>

      <Button
        type='button'
        variant='outline'
        className='h-12 w-full rounded-xl'
        disabled={googleMutation.isPending}
        onClick={() => googleMutation.mutate()}
      >
        <span className='font-bold text-[#4285f4]'>G</span>
        {googleMutation.isPending ? 'Đang chuyển đến Google...' : 'Tiếp tục với Google'}
      </Button>

      <p className='text-center text-sm text-muted-foreground'>
        Chưa có tài khoản?{' '}
        <Link className='font-semibold text-primary' href={PATHS.AUTH.REGISTER}>
          Đăng ký miễn phí
        </Link>
      </p>
    </div>
  )
}
