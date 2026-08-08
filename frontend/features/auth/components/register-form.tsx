'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PATHS } from '@/constants'
import { useRegisterMutation } from '../queries'
import { RegisterSchema, type RegisterInput } from '../schemas'

export function RegisterForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const mutation = useRegisterMutation()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' }
  })

  return (
    <div className='space-y-6'>
      <header>
        <p className='text-sm font-semibold text-primary'>Bắt đầu cùng nhau</p>
        <h2 className='mt-1 text-2xl font-bold tracking-tight'>Tạo tài khoản</h2>
        <p className='mt-2 text-sm leading-6 text-muted-foreground'>
          Chỉ mất một phút để tạo phòng và mời bạn cùng trọ.
        </p>
      </header>

      <form className='space-y-4' onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        <Input
          id='name'
          label='Họ và tên'
          autoComplete='name'
          placeholder='Nguyễn Văn A'
          icon={<UserRound className='size-4' />}
          error={errors.name?.message}
          disabled={mutation.isPending}
          {...register('name')}
        />
        <Input
          id='email'
          type='email'
          label='Email'
          autoComplete='email'
          placeholder='ban@example.com'
          icon={<Mail className='size-4' />}
          error={errors.email?.message}
          disabled={mutation.isPending}
          {...register('email')}
        />
        <Input
          id='password'
          type={showPassword ? 'text' : 'password'}
          label='Mật khẩu'
          autoComplete='new-password'
          placeholder='Tối thiểu 6 ký tự'
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
          disabled={mutation.isPending}
          {...register('password')}
        />
        <Input
          id='confirmPassword'
          type={showPassword ? 'text' : 'password'}
          label='Xác nhận mật khẩu'
          autoComplete='new-password'
          placeholder='Nhập lại mật khẩu'
          icon={<LockKeyhole className='size-4' />}
          error={errors.confirmPassword?.message}
          disabled={mutation.isPending}
          {...register('confirmPassword')}
        />
        <Button className='h-12 w-full rounded-xl font-semibold' disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className='size-4 animate-spin' />}
          {mutation.isPending ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </Button>
      </form>

      <p className='text-center text-sm text-muted-foreground'>
        Đã có tài khoản?{' '}
        <Link className='font-semibold text-primary' href={PATHS.AUTH.LOGIN}>
          Đăng nhập
        </Link>
      </p>
    </div>
  )
}
