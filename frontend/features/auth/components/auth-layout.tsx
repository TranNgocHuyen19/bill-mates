'use client'

import type { ReactNode } from 'react'
import { CheckCircle2, ShieldCheck, WalletCards } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className='relative min-h-screen overflow-hidden bg-background lg:grid lg:grid-cols-[1.05fr_0.95fr]'>
      <section className='relative hidden min-h-screen overflow-hidden bg-primary p-12 text-white lg:flex lg:flex-col'>
        <div className='absolute top-1/3 -left-32 size-96 rounded-full bg-secondary/30 blur-3xl' />
        <div className='absolute -top-20 -right-20 size-80 rounded-full bg-white/10 blur-2xl' />

        <div className='relative flex items-center gap-3'>
          <span className='grid size-11 place-items-center rounded-2xl border border-white/20 bg-white/10'>
            <WalletCards className='size-6' />
          </span>
          <span className='text-2xl font-bold tracking-tight'>Bill Mates</span>
        </div>

        <div className='relative my-auto max-w-lg'>
          <p className='mb-4 text-sm font-semibold tracking-[0.18em] text-white/65 uppercase'>
            Sống chung, tính riêng thật rõ
          </p>
          <h1 className='text-5xl leading-[1.08] font-bold tracking-[-0.035em]'>
            Chia tiền công bằng mà không mất tình bạn.
          </h1>
          <div className='mt-10 space-y-5'>
            {[
              'Chia từng món cho đúng người sử dụng',
              'Theo dõi đơn nháp trước khi cộng công nợ',
              'Xác nhận thanh toán minh bạch trong phòng'
            ].map((item) => (
              <div key={item} className='flex items-center gap-3 text-sm text-white/85'>
                <CheckCircle2 className='text-secondary-container size-5' />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className='relative flex items-center gap-2 text-xs text-white/60'>
          <ShieldCheck className='size-4' />
          Phiên đăng nhập được bảo vệ bởi Supabase Auth
        </div>
      </section>

      <section className='relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-8'>
        <div className='absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top_right,rgba(63,81,181,0.18),transparent_62%)]' />
        <div className='relative w-full max-w-md'>
          <div className='mb-8 flex items-center justify-center gap-2 lg:hidden'>
            <span className='grid size-10 place-items-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20'>
              <WalletCards className='size-5' />
            </span>
            <span className='text-xl font-bold tracking-tight text-primary'>Bill Mates</span>
          </div>
          <div className='border-outline-variant/40 rounded-3xl border bg-card p-5 shadow-[0_20px_60px_rgba(36,56,156,0.08)] sm:p-8'>
            {children}
          </div>
        </div>
      </section>
    </main>
  )
}
