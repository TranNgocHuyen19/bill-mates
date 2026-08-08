'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PATHS } from '@/constants'
import { useForgotPasswordMutation } from '../queries'
import { ForgotPasswordSchema, type ForgotPasswordInput } from '../schemas'

export function ForgotPasswordForm() {
  const mutation = useForgotPasswordMutation()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '' }
  })

  return (
    <div className='space-y-6'>
      <Link className='inline-flex items-center gap-2 text-sm font-semibold text-primary' href={PATHS.AUTH.LOGIN}>
        <ArrowLeft className='size-4' />
        Quay lại đăng nhập
      </Link>
      <header>
        <h2 className='text-2xl font-bold tracking-tight'>Khôi phục mật khẩu</h2>
        <p className='mt-2 text-sm leading-6 text-muted-foreground'>
          Nhập email của bạn. Chúng tôi sẽ gửi một liên kết khôi phục an toàn.
        </p>
      </header>
      <form className='space-y-4' onSubmit={handleSubmit((data) => mutation.mutate(data))}>
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
        <Button className='h-12 w-full rounded-xl font-semibold' disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className='size-4 animate-spin' />}
          {mutation.isPending ? 'Đang gửi...' : 'Gửi liên kết khôi phục'}
        </Button>
      </form>
    </div>
  )
}
