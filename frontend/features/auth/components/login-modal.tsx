'use client'

import { Dialog } from 'radix-ui'
import { LockKeyhole, X } from 'lucide-react'

import { LoginForm } from './login-form'

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className='fixed inset-0 z-50 bg-foreground/45 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:fade-in' />
        <Dialog.Content className='fixed inset-x-3 top-1/2 z-50 max-h-[calc(100dvh-1.5rem)] -translate-y-1/2 overflow-y-auto rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in sm:inset-x-auto sm:left-1/2 sm:w-[min(92vw,28rem)] sm:-translate-x-1/2 sm:p-7'>
          <Dialog.Close asChild>
            <button
              type='button'
              className='absolute top-3 right-3 grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none'
              aria-label='Đóng cửa sổ đăng nhập'
            >
              <X className='size-5' />
            </button>
          </Dialog.Close>

          <div className='mb-5 flex items-start gap-3 pr-10'>
            <span className='grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary'>
              <LockKeyhole className='size-5' />
            </span>
            <div>
              <Dialog.Title className='text-xl font-bold tracking-tight'>Đăng nhập Bill Mates</Dialog.Title>
              <Dialog.Description className='mt-1 text-sm leading-5 text-muted-foreground'>
                Nhập email và mật khẩu ngay trên trang này.
              </Dialog.Description>
            </div>
          </div>

          <LoginForm showHeader={false} onSuccess={() => onOpenChange(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
