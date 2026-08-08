'use client'

import { Home, Loader2, Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { CreateRoomInput } from '../api'

interface CreateRoomModalProps {
  isOpen: boolean
  isPending: boolean
  onClose: () => void
  onSubmit: (data: CreateRoomInput) => void
}

export function CreateRoomModal({ isOpen, isPending, onClose, onSubmit }: CreateRoomModalProps) {
  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-end bg-black/55 sm:items-center sm:justify-center sm:p-4'>
      <button className='absolute inset-0 cursor-default' aria-label='Đóng' onClick={onClose} />
      <Card className='relative w-full rounded-t-3xl rounded-b-none border-0 p-5 shadow-2xl sm:max-w-md sm:rounded-3xl sm:border'>
        <div className='bg-outline-variant mx-auto mb-5 h-1.5 w-12 rounded-full sm:hidden' />
        <button
          className='absolute top-5 right-5 grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-muted'
          onClick={onClose}
          aria-label='Đóng'
        >
          <X className='size-5' />
        </button>
        <header className='pr-12'>
          <span className='grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary'>
            <Home className='size-5' />
          </span>
          <h2 className='mt-4 text-xl font-bold'>Tạo phòng mới</h2>
          <p className='mt-1 text-sm text-muted-foreground'>Dùng cho phòng trọ, căn hộ hoặc một chuyến đi chung.</p>
        </header>
        <form
          className='mt-5 space-y-4'
          onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            onSubmit({
              name: String(form.get('name')).trim(),
              description: String(form.get('description')).trim() || undefined,
              currency: 'VND'
            })
          }}
        >
          <Input name='name' label='Tên phòng' placeholder='Phòng trọ 101' minLength={2} required autoFocus />
          <Input name='description' label='Mô tả' placeholder='Chi phí sinh hoạt chung của phòng' />
          <div className='flex gap-3 pt-2'>
            <Button type='button' variant='outline' className='h-12 flex-1 rounded-xl' onClick={onClose}>
              Hủy
            </Button>
            <Button className='h-12 flex-1 rounded-xl' disabled={isPending}>
              {isPending ? <Loader2 className='size-4 animate-spin' /> : <Plus className='size-4' />}
              Tạo phòng
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
