'use client'

import * as React from 'react'
import {
  Archive,
  CheckCircle2,
  Clock3,
  CreditCard,
  FilePenLine,
  Home,
  Loader2,
  ReceiptText,
  UsersRound,
  XCircle
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRoomActivityQuery, type Activity } from '../index'
import { useRoomsQuery } from '@/features/rooms'
import { formatVnd } from '@/lib/money'
import { cn } from '@/lib/utils'

const filters = [
  { value: '', label: 'Tất cả' },
  { value: 'expense', label: 'Khoản chi' },
  { value: 'settlement', label: 'Thanh toán' },
  { value: 'room', label: 'Phòng' }
]

const actionContent: Record<
  string,
  { title: string; icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  'room.created': { title: 'đã tạo phòng', icon: Home, tone: 'bg-primary/10 text-primary' },
  'room.updated': { title: 'đã cập nhật phòng', icon: FilePenLine, tone: 'bg-primary/10 text-primary' },
  'room.archived': { title: 'đã lưu trữ phòng', icon: Archive, tone: 'bg-muted text-muted-foreground' },
  'expense.draft_created': { title: 'đã lưu một đơn nháp', icon: ReceiptText, tone: 'bg-tertiary/10 text-tertiary' },
  'expense.posted': { title: 'đã chốt một khoản chi', icon: CheckCircle2, tone: 'bg-secondary/10 text-secondary' },
  'expense.cancelled': { title: 'đã hủy một khoản chi', icon: XCircle, tone: 'bg-destructive/10 text-destructive' },
  'settlement.created': { title: 'đã gửi yêu cầu thanh toán', icon: CreditCard, tone: 'bg-primary/10 text-primary' },
  'settlement.confirmed': {
    title: 'đã xác nhận nhận tiền',
    icon: CheckCircle2,
    tone: 'bg-secondary/10 text-secondary'
  },
  'settlement.rejected': { title: 'đã từ chối thanh toán', icon: XCircle, tone: 'bg-destructive/10 text-destructive' },
  'settlement.cancelled': { title: 'đã hủy yêu cầu thanh toán', icon: XCircle, tone: 'bg-muted text-muted-foreground' }
}

function detailFor(activity: Activity): string | null {
  const values = activity.new_values
  if (typeof values?.title === 'string' && typeof values.total_amount === 'string') {
    return `${values.title} · ${formatVnd(values.total_amount)}`
  }
  if (typeof values?.amount === 'string') {
    return formatVnd(values.amount)
  }
  if (typeof values?.name === 'string') {
    return values.name
  }
  return null
}

function HistoryContent() {
  const searchParams = useSearchParams()
  const roomsQuery = useRoomsQuery()
  const requestedRoomId = searchParams.get('roomId') ?? ''
  const [selectedRoomId, setSelectedRoomId] = React.useState(requestedRoomId)
  const [entityType, setEntityType] = React.useState('')
  const activeRoomId = roomsQuery.data?.some((room) => room.id === selectedRoomId)
    ? selectedRoomId
    : (roomsQuery.data?.[0]?.id ?? '')
  const activityQuery = useRoomActivityQuery(activeRoomId, entityType)

  return (
    <div className='min-h-screen bg-background pb-24 text-foreground'>
      <Navbar />
      <main className='mx-auto w-full max-w-3xl space-y-5 px-4 py-5 sm:py-8'>
        <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <p className='text-xs font-bold tracking-[0.16em] text-primary uppercase'>Minh bạch theo thời gian</p>
            <h1 className='mt-1 text-2xl font-bold tracking-tight'>Lịch sử hoạt động</h1>
            <p className='mt-1 text-sm text-muted-foreground'>Mọi thay đổi quan trọng trong phòng đều được ghi lại.</p>
          </div>
          {roomsQuery.data?.length ? (
            <Select value={activeRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger size='sm' className='w-full bg-card font-semibold sm:w-56' aria-label='Chọn phòng'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roomsQuery.data.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    <span className='block min-w-0 truncate'>{room.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </header>

        <div className='flex gap-2 overflow-x-auto pb-1'>
          {filters.map((filter) => (
            <Button
              key={filter.value}
              variant={entityType === filter.value ? 'default' : 'outline'}
              size='sm'
              className='shrink-0 rounded-full'
              onClick={() => setEntityType(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {roomsQuery.isPending || activityQuery.isPending ? (
          <Card className='grid min-h-64 place-items-center rounded-3xl'>
            <Loader2 className='size-7 animate-spin text-primary' />
          </Card>
        ) : !activeRoomId ? (
          <Card className='rounded-3xl p-8 text-center'>
            <UsersRound className='mx-auto size-9 text-primary' />
            <p className='mt-3 font-bold'>Chưa có phòng để xem lịch sử</p>
          </Card>
        ) : activityQuery.data?.length ? (
          <section className='relative space-y-3 before:absolute before:top-6 before:bottom-6 before:left-[27px] before:w-px before:bg-border'>
            {activityQuery.data.map((activity) => {
              const content = actionContent[activity.action] ?? {
                title: 'đã cập nhật dữ liệu',
                icon: Clock3,
                tone: 'bg-muted text-muted-foreground'
              }
              const Icon = content.icon
              const detail = detailFor(activity)
              return (
                <Card key={activity.id} className='relative ml-0 flex gap-3 rounded-2xl p-4'>
                  <span className={cn('z-10 grid size-11 shrink-0 place-items-center rounded-2xl', content.tone)}>
                    <Icon className='size-5' />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm leading-5'>
                      <strong>{activity.actor_name ?? 'Hệ thống'}</strong> {content.title}
                    </p>
                    {detail && <p className='mt-1 truncate text-xs font-semibold text-primary'>{detail}</p>}
                    <p className='mt-1 text-xs text-muted-foreground'>
                      {new Date(activity.created_at).toLocaleString('vi-VN', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                </Card>
              )
            })}
          </section>
        ) : (
          <Card className='rounded-3xl border-dashed p-8 text-center'>
            <Clock3 className='mx-auto size-9 text-primary' />
            <p className='mt-3 font-bold'>Chưa có hoạt động phù hợp</p>
            <p className='mt-1 text-sm text-muted-foreground'>Thử chọn một bộ lọc khác.</p>
          </Card>
        )}
      </main>
    </div>
  )
}

export function ActivityHistoryPage() {
  return (
    <React.Suspense
      fallback={
        <div className='grid min-h-screen place-items-center bg-background'>
          <Loader2 className='size-7 animate-spin text-primary' />
        </div>
      }
    >
      <HistoryContent />
    </React.Suspense>
  )
}
