'use client'

import * as React from 'react'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CreditCard,
  Loader2,
  RefreshCcw,
  Sparkles,
  X
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { Navbar } from '@/components/navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PATHS } from '@/constants'
import {
  useBalancesQuery,
  useCancelSettlementMutation,
  useConfirmSettlementMutation,
  useRejectSettlementMutation,
  useSettlementsQuery
} from '../index'
import { useRoomsQuery } from '@/features/rooms'
import { formatVnd } from '@/lib/money'
import { cn } from '@/lib/utils'

const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  rejected: 'Bị từ chối',
  cancelled: 'Đã hủy'
} as const

function DebtsContent() {
  const searchParams = useSearchParams()
  const roomsQuery = useRoomsQuery()
  const requestedRoomId = searchParams.get('roomId') ?? ''
  const [selectedRoomId, setSelectedRoomId] = React.useState(requestedRoomId)
  const activeRoomId = selectedRoomId || roomsQuery.data?.[0]?.id || ''
  const balancesQuery = useBalancesQuery(activeRoomId)
  const settlementsQuery = useSettlementsQuery(activeRoomId)
  const confirmSettlement = useConfirmSettlementMutation(activeRoomId)
  const rejectSettlement = useRejectSettlementMutation(activeRoomId)
  const cancelSettlement = useCancelSettlementMutation(activeRoomId)
  const balances = balancesQuery.data
  const currentMemberId = balances?.current_member_id
  const toPay = balances?.suggestions.filter((item) => item.from_member_id === currentMemberId) ?? []
  const toReceive = balances?.suggestions.filter((item) => item.to_member_id === currentMemberId) ?? []

  if (roomsQuery.isPending) {
    return (
      <div className='grid min-h-screen place-items-center bg-background'>
        <Loader2 className='size-7 animate-spin text-primary' aria-label='Đang tải công nợ' />
      </div>
    )
  }

  if (!roomsQuery.data?.length) {
    return (
      <div className='min-h-screen bg-background'>
        <Navbar />
        <main className='mx-auto max-w-lg px-4 py-10'>
          <Card className='rounded-3xl p-8 text-center'>
            <CreditCard className='mx-auto size-10 text-primary' />
            <h1 className='mt-4 text-xl font-bold'>Chưa có phòng để tính công nợ</h1>
            <Button asChild className='mt-5 rounded-xl'>
              <Link href={PATHS.ROOMS}>Tạo hoặc tham gia phòng</Link>
            </Button>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background pb-24 text-foreground'>
      <Navbar />
      <main className='mx-auto w-full max-w-5xl space-y-5 px-4 py-5 sm:py-8'>
        <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <p className='text-xs font-bold tracking-[0.16em] text-primary uppercase'>Sòng phẳng, rõ ràng</p>
            <h1 className='mt-1 text-2xl font-bold tracking-tight sm:text-3xl'>Công nợ trong phòng</h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              Chỉ đơn đã chốt và thanh toán đã xác nhận mới được tính.
            </p>
          </div>
          <div className='grid min-w-0 gap-1 text-xs font-semibold text-muted-foreground sm:w-56'>
            <label htmlFor='debts-room'>Phòng đang xem</label>
            <Select value={activeRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger id='debts-room' size='sm' className='w-full bg-card font-semibold text-foreground'>
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
          </div>
        </header>

        {balancesQuery.isPending ? (
          <Card className='grid min-h-52 place-items-center rounded-3xl'>
            <Loader2 className='size-7 animate-spin text-primary' />
          </Card>
        ) : balances ? (
          <>
            <section className='grid grid-cols-2 gap-3 sm:grid-cols-3' aria-label='Tổng quan công nợ của bạn'>
              <Card className='relative col-span-2 min-h-28 overflow-hidden rounded-3xl border-primary/20 bg-primary p-4 text-primary-foreground shadow-lg shadow-primary/15 sm:col-span-1'>
                <div className='pointer-events-none absolute -top-12 -right-10 size-32 rounded-full border-[22px] border-primary-foreground/5' />
                <div className='relative flex h-full items-center justify-between gap-4'>
                  <div className='min-w-0'>
                    <p className='text-[11px] font-bold tracking-[0.08em] uppercase opacity-70'>Số dư của bạn</p>
                    <p className='mt-1 text-2xl font-bold tracking-tight break-words tabular-nums'>
                      {formatVnd(Math.abs(Number(balances.current_balance)))}
                    </p>
                    <p className='mt-1 text-xs opacity-80'>
                      {Number(balances.current_balance) > 0
                        ? 'Bạn đang được nhận lại'
                        : Number(balances.current_balance) < 0
                          ? 'Bạn đang cần thanh toán'
                          : 'Bạn đã sòng phẳng'}
                    </p>
                  </div>
                  <span className='grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-foreground/12'>
                    <CreditCard className='size-5' />
                  </span>
                </div>
              </Card>
              <Card className='min-w-0 rounded-2xl border-secondary/20 bg-secondary/5 p-3.5 sm:rounded-3xl sm:p-4'>
                <div className='flex items-center gap-2'>
                  <span className='grid size-8 shrink-0 place-items-center rounded-xl bg-secondary/10 text-secondary'>
                    <ArrowDownLeft className='size-4' />
                  </span>
                  <p className='text-xs font-semibold text-muted-foreground'>Cần thu</p>
                </div>
                <p className='mt-3 text-lg font-bold tracking-tight break-all text-secondary tabular-nums'>
                  {formatVnd(balances.total_to_receive)}
                </p>
              </Card>
              <Card className='min-w-0 rounded-2xl border-destructive/20 bg-destructive/5 p-3.5 sm:rounded-3xl sm:p-4'>
                <div className='flex items-center gap-2'>
                  <span className='grid size-8 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive'>
                    <ArrowUpRight className='size-4' />
                  </span>
                  <p className='text-xs font-semibold text-muted-foreground'>Cần trả</p>
                </div>
                <p className='mt-3 text-lg font-bold tracking-tight break-all text-destructive tabular-nums'>
                  {formatVnd(balances.total_to_pay)}
                </p>
              </Card>
            </section>

            <Card className='rounded-3xl border-primary/20 bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-5'>
              <div className='flex items-center gap-2'>
                <Badge className='gap-1 rounded-full'>
                  <Sparkles className='size-3' /> Gợi ý tối ưu
                </Badge>
                <span className='text-xs text-muted-foreground'>
                  {balances.suggestions.length} giao dịch cho cả phòng
                </span>
              </div>
              <div className='mt-4 grid gap-3 lg:grid-cols-2'>
                {toPay.map((item) => (
                  <div
                    key={`${item.from_member_id}-${item.to_member_id}`}
                    className='flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm'
                  >
                    <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive'>
                      <ArrowUpRight className='size-5' />
                    </span>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-bold'>Trả {item.to_name}</p>
                      <p className='text-xs text-muted-foreground'>{formatVnd(item.amount)}</p>
                    </div>
                    <Button size='sm' className='rounded-xl' asChild>
                      <Link
                        href={`${PATHS.DEBTS.SETTLE}?roomId=${activeRoomId}&toMemberId=${item.to_member_id}&amount=${item.amount}`}
                      >
                        Trả ngay <ArrowRight className='size-3.5' />
                      </Link>
                    </Button>
                  </div>
                ))}
                {toReceive.map((item) => (
                  <div
                    key={`${item.from_member_id}-${item.to_member_id}`}
                    className='flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm'
                  >
                    <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-secondary/10 text-secondary'>
                      <ArrowDownLeft className='size-5' />
                    </span>
                    <div>
                      <p className='text-sm font-bold'>Nhận từ {item.from_name}</p>
                      <p className='text-xs text-muted-foreground'>{formatVnd(item.amount)}</p>
                    </div>
                  </div>
                ))}
                {!toPay.length && !toReceive.length && (
                  <div className='rounded-2xl bg-card p-5 text-sm text-muted-foreground lg:col-span-2'>
                    Bạn không có giao dịch nào cần thực hiện.
                  </div>
                )}
              </div>
            </Card>

            <section>
              <h2 className='text-base font-bold'>Số dư thành viên</h2>
              <div className='mt-3 grid gap-2 sm:grid-cols-2'>
                {balances.balances.map((member) => (
                  <Card key={member.member_id} className='flex items-center justify-between rounded-2xl p-4'>
                    <div>
                      <p className='text-sm font-bold'>{member.display_name}</p>
                      <p className='text-xs text-muted-foreground'>
                        Đã trả {formatVnd(member.paid)} · Được chia {formatVnd(member.owed)}
                      </p>
                    </div>
                    <p
                      className={cn(
                        'font-bold',
                        Number(member.balance) > 0
                          ? 'text-secondary'
                          : Number(member.balance) < 0
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                      )}
                    >
                      {Number(member.balance) > 0 ? '+' : ''}
                      {formatVnd(member.balance)}
                    </p>
                  </Card>
                ))}
              </div>
            </section>
          </>
        ) : (
          <Card className='rounded-3xl p-6 text-sm text-destructive'>Không thể tải công nợ của phòng này.</Card>
        )}

        <section>
          <div className='flex items-center justify-between'>
            <h2 className='text-base font-bold'>Thanh toán gần đây</h2>
            <Button variant='ghost' size='sm' onClick={() => settlementsQuery.refetch()} className='gap-1 rounded-xl'>
              <RefreshCcw className='size-3.5' /> Làm mới
            </Button>
          </div>
          <div className='mt-3 space-y-2'>
            {settlementsQuery.data?.map((settlement) => {
              const isRecipient = settlement.to_member_id === currentMemberId
              const isSender = settlement.from_member_id === currentMemberId
              return (
                <Card key={settlement.id} className='rounded-2xl p-4'>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <p className='text-sm font-bold'>
                        {settlement.from_name} → {settlement.to_name}
                      </p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {new Date(settlement.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='font-bold'>{formatVnd(settlement.amount)}</p>
                      <Badge variant='outline' className='mt-1 rounded-full text-[10px]'>
                        {statusLabels[settlement.status]}
                      </Badge>
                    </div>
                  </div>
                  {settlement.status === 'pending' && (isRecipient || isSender) && (
                    <div className='mt-3 flex gap-2 border-t pt-3'>
                      {isRecipient && (
                        <>
                          <Button
                            size='sm'
                            className='flex-1 rounded-xl'
                            onClick={() => confirmSettlement.mutate(settlement.id)}
                          >
                            <Check className='size-4' /> Đã nhận tiền
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            className='rounded-xl text-destructive'
                            onClick={() =>
                              rejectSettlement.mutate({
                                settlementId: settlement.id,
                                reason: 'Chưa nhận được tiền'
                              })
                            }
                          >
                            <X className='size-4' /> Từ chối
                          </Button>
                        </>
                      )}
                      {isSender && (
                        <Button
                          size='sm'
                          variant='outline'
                          className='ml-auto rounded-xl'
                          onClick={() => cancelSettlement.mutate(settlement.id)}
                        >
                          Hủy yêu cầu
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
            {!settlementsQuery.isPending && !settlementsQuery.data?.length && (
              <Card className='rounded-2xl border-dashed p-5 text-center text-sm text-muted-foreground'>
                Chưa có thanh toán nào trong phòng.
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export function DebtsListPage() {
  return (
    <React.Suspense
      fallback={
        <div className='grid min-h-screen place-items-center bg-background'>
          <Loader2 className='size-7 animate-spin text-primary' />
        </div>
      }
    >
      <DebtsContent />
    </React.Suspense>
  )
}
