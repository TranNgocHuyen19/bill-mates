'use client'

import * as React from 'react'
import { DoorOpen, Loader2, Plus, RefreshCw, Sparkles, UsersRound } from 'lucide-react'

import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CreateRoomModal } from './create-room-modal'
import { RoomCard } from './room-card'
import { useCreateRoomMutation, useRoomsQuery } from '../queries'
import type { CreateRoomInput } from '../api'
import { formatVnd } from '@/lib/money'

export function RoomsListPage() {
  const [isCreating, setIsCreating] = React.useState(false)
  const roomsQuery = useRoomsQuery()
  const createRoom = useCreateRoomMutation()
  const rooms = roomsQuery.data ?? []
  const totalExpenses = rooms.reduce((sum, room) => sum + Number(room.total_expenses), 0)

  const handleCreate = (data: CreateRoomInput) => {
    createRoom.mutate(data, {
      onSuccess: () => setIsCreating(false)
    })
  }

  return (
    <div className='min-h-screen bg-background pb-24 text-foreground'>
      <Navbar />
      <main className='mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-9'>
        <header className='flex items-end justify-between gap-4'>
          <div>
            <p className='text-xs font-semibold tracking-[0.16em] text-primary uppercase'>Không gian chung</p>
            <h1 className='mt-1 text-2xl font-bold tracking-tight sm:text-3xl'>Phòng của bạn</h1>
            <p className='mt-1 text-sm text-muted-foreground'>Mỗi phòng giữ một sổ chi tiêu và công nợ riêng.</p>
          </div>
          <Button className='h-11 shrink-0 rounded-xl' onClick={() => setIsCreating(true)}>
            <Plus className='size-4' />
            <span className='hidden sm:inline'>Tạo phòng</span>
            <span className='sm:hidden'>Tạo</span>
          </Button>
        </header>

        <section className='mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3'>
          <Card className='rounded-2xl border-primary/15 bg-primary/5 p-4'>
            <UsersRound className='size-5 text-primary' />
            <p className='mt-3 text-2xl font-bold'>{rooms.length}</p>
            <p className='text-xs text-muted-foreground'>Phòng đang tham gia</p>
          </Card>
          <Card className='rounded-2xl border-secondary/20 bg-secondary/5 p-4 sm:col-span-2'>
            <Sparkles className='size-5 text-secondary' />
            <p className='mt-3 text-2xl font-bold text-secondary'>{formatVnd(totalExpenses)}</p>
            <p className='text-xs text-muted-foreground'>Tổng chi đã chốt ở mọi phòng</p>
          </Card>
        </section>

        <section className='mt-7'>
          <div className='mb-3 flex items-center justify-between'>
            <h2 className='font-bold'>Danh sách phòng</h2>
            {roomsQuery.isFetching && !roomsQuery.isPending && (
              <Loader2 className='size-4 animate-spin text-primary' aria-label='Đang cập nhật' />
            )}
          </div>

          {roomsQuery.isPending ? (
            <div className='grid gap-4 md:grid-cols-2'>
              {[0, 1].map((item) => (
                <Card key={item} className='h-52 animate-pulse rounded-2xl bg-muted' />
              ))}
            </div>
          ) : roomsQuery.isError ? (
            <Card className='rounded-2xl border-destructive/25 p-7 text-center'>
              <p className='font-semibold'>Chưa tải được danh sách phòng</p>
              <p className='mt-1 text-sm text-muted-foreground'>Kiểm tra kết nối API rồi thử lại.</p>
              <Button variant='outline' className='mt-4 rounded-xl' onClick={() => roomsQuery.refetch()}>
                <RefreshCw className='size-4' />
                Thử lại
              </Button>
            </Card>
          ) : rooms.length ? (
            <div className='grid gap-4 md:grid-cols-2'>
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <Card className='rounded-3xl border-2 border-dashed border-primary/20 bg-primary/5 px-6 py-10 text-center'>
              <span className='mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary'>
                <DoorOpen className='size-7' />
              </span>
              <h2 className='mt-4 text-lg font-bold'>Tạo căn phòng đầu tiên</h2>
              <p className='mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground'>
                Sau khi tạo, bạn có thể gửi liên kết mời cho những người cùng trọ.
              </p>
              <Button className='mt-5 h-11 rounded-xl' onClick={() => setIsCreating(true)}>
                <Plus className='size-4' />
                Tạo phòng ngay
              </Button>
            </Card>
          )}
        </section>
      </main>

      <CreateRoomModal
        isOpen={isCreating}
        isPending={createRoom.isPending}
        onClose={() => setIsCreating(false)}
        onSubmit={handleCreate}
      />
    </div>
  )
}
