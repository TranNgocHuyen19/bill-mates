'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useResetPasswordMutation } from '../queries'
import { ResetPasswordSchema, type ResetPasswordInput } from '../schemas'

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const mutation = useResetPasswordMutation()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' }
  })

  return (
    <div className='space-y-6'>
      <header>
        <p className='text-sm font-semibold text-primary'>Bảo mật tài khoản</p>
        <h2 className='mt-1 text-2xl font-bold tracking-tight'>Đặt mật khẩu mới</h2>
        <p className='mt-2 text-sm leading-6 text-muted-foreground'>
          Chọn mật khẩu dễ nhớ với bạn nhưng khó đoán với người khác.
        </p>
      </header>
      <form className='space-y-4' onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        <Input
          id='password'
          type={showPassword ? 'text' : 'password'}
          label='Mật khẩu mới'
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
          placeholder='Nhập lại mật khẩu mới'
          icon={<LockKeyhole className='size-4' />}
          error={errors.confirmPassword?.message}
          disabled={mutation.isPending}
          {...register('confirmPassword')}
        />
        <Button className='h-12 w-full rounded-xl font-semibold' disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className='size-4 animate-spin' />}
          {mutation.isPending ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
        </Button>
      </form>
    </div>
  )
}
