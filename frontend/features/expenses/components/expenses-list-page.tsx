'use client'

import * as React from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileClock,
  Loader2,
  Plus,
  ReceiptText,
  RefreshCcw,
  Trash2,
  UsersRound
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { Navbar } from '@/components/navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PATHS } from '@/constants'
import { useRoomDetailQuery, useRoomsQuery } from '@/features/rooms'
import { formatVnd } from '@/lib/money'
import { useCancelExpenseMutation, useExpensesQuery, type Expense } from '../index'

function getExpenseMemberTotals(expense: Expense): Map<string, number> {
  const totals = new Map<string, number>()
  for (const item of expense.items) {
    for (const split of item.splits) {
      totals.set(split.member_id, (totals.get(split.member_id) ?? 0) + Number(split.amount_owed))
    }
  }
  return totals
}

function ExpensesListContent() {
  const searchParams = useSearchParams()
  const requestedRoomId = searchParams.get('roomId') ?? ''
  const roomsQuery = useRoomsQuery()
  const [selectedRoomId, setSelectedRoomId] = React.useState(requestedRoomId)
  const selectedRoomExists = roomsQuery.data?.some((room) => room.id === selectedRoomId)
  const activeRoomId = selectedRoomExists ? selectedRoomId : (roomsQuery.data?.[0]?.id ?? '')
  const roomQuery = useRoomDetailQuery(activeRoomId)
  const expensesQuery = useExpensesQuery(activeRoomId)
  const cancelDraft = useCancelExpenseMutation(activeRoomId)
  const membersById = new Map(roomQuery.data?.members.map((member) => [member.id, member]) ?? [])
  const drafts = expensesQuery.data?.filter((expense) => expense.status === 'draft') ?? []
  const postedExpenses = expensesQuery.data?.filter((expense) => expense.status === 'posted') ?? []
  const postedTotal = postedExpenses.reduce((sum, expense) => sum + Number(expense.total_amount), 0)

  if (roomsQuery.isPending) {
    return (
      <div className='grid min-h-screen place-items-center bg-background'>
        <Loader2 className='size-7 animate-spin text-primary' aria-label='Đang tải khoản chi' />
      </div>
    )
  }

  if (roomsQuery.isError) {
    return (
      <div className='min-h-screen bg-background'>
        <Navbar />
        <main className='mx-auto max-w-lg px-4 py-10'>
          <Card className='rounded-3xl p-8 text-center'>
            <p className='font-bold text-destructive'>Không thể tải danh sách phòng.</p>
            <p className='mt-2 text-sm text-muted-foreground'>Kiểm tra kết nối rồi thử lại.</p>
            <Button variant='outline' className='mt-5 rounded-xl' onClick={() => roomsQuery.refetch()}>
              <RefreshCcw className='size-4' />
              Thử lại
            </Button>
          </Card>
        </main>
      </div>
    )
  }

  if (!roomsQuery.data?.length) {
    return (
      <div className='min-h-screen bg-background'>
        <Navbar />
        <main className='mx-auto max-w-lg px-4 py-10'>
          <Card className='rounded-3xl p-8 text-center'>
            <ReceiptText className='mx-auto size-10 text-primary' />
            <h1 className='mt-4 text-xl font-bold'>Chưa có phòng để lưu khoản chi</h1>
            <p className='mt-2 text-sm text-muted-foreground'>Tạo hoặc tham gia phòng trước khi ghi hóa đơn.</p>
            <Button asChild className='mt-5 rounded-xl'>
              <Link href={PATHS.ROOMS}>Đến danh sách phòng</Link>
            </Button>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background pb-24 text-foreground'>
      <Navbar />
      <main className='mx-auto w-full max-w-5xl space-y-6 px-4 py-5 sm:px-6 sm:py-8'>
        <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <p className='text-xs font-bold tracking-[0.16em] text-primary uppercase'>Sổ chi tiêu chung</p>
            <h1 className='mt-1 text-2xl font-bold tracking-tight sm:text-3xl'>Đơn nháp & khoản chi</h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              Lưu trước, chia từng món sau. Chỉ khoản đã chốt mới tính vào công nợ.
            </p>
          </div>
          <div className='grid min-w-0 gap-1 text-xs font-semibold text-muted-foreground sm:w-56'>
            <label htmlFor='expenses-room'>Phòng đang xem</label>
            <Select value={activeRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger id='expenses-room' size='sm' className='w-full bg-card font-semibold text-foreground'>
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

        <Card className='relative overflow-hidden rounded-3xl border-0 bg-[linear-gradient(135deg,#24389c,#3448aa_58%,#006c49)] p-5 text-white shadow-xl shadow-primary/15 sm:p-6'>
          <div className='absolute -top-16 -right-14 size-44 rounded-full border-[28px] border-white/5' />
          <div className='relative flex flex-col items-start justify-between gap-4 min-[400px]:flex-row'>
            <div>
              <p className='text-sm text-white/70'>Tổng đã chốt trong phòng</p>
              <p className='mt-1 text-3xl font-bold tabular-nums'>{formatVnd(postedTotal)}</p>
            </div>
            <Button asChild variant='secondary' className='h-11 rounded-xl'>
              <Link href={`${PATHS.EXPENSES.NEW}?roomId=${activeRoomId}`}>
                <Plus className='size-4' />
                Thêm khoản chi
              </Link>
            </Button>
          </div>
          <div className='relative mt-5 grid grid-cols-2 gap-3'>
            <div className='rounded-2xl bg-white/10 p-3 backdrop-blur'>
              <p className='text-xs text-white/65'>Đơn đang làm</p>
              <p className='mt-1 text-xl font-bold'>{drafts.length}</p>
            </div>
            <div className='rounded-2xl bg-white/10 p-3 backdrop-blur'>
              <p className='text-xs text-white/65'>Khoản đã chốt</p>
              <p className='mt-1 text-xl font-bold'>{postedExpenses.length}</p>
            </div>
          </div>
        </Card>

        {expensesQuery.isPending || roomQuery.isPending ? (
          <div className='space-y-3'>
            <Card className='h-32 animate-pulse rounded-3xl bg-muted' />
            <Card className='h-32 animate-pulse rounded-3xl bg-muted' />
          </div>
        ) : expensesQuery.isError || roomQuery.isError ? (
          <Card className='rounded-3xl p-6 text-center'>
            <p className='font-bold text-destructive'>Không thể tải danh sách khoản chi.</p>
            <p className='mt-1 text-sm text-muted-foreground'>Kiểm tra kết nối rồi thử lại.</p>
            <Button
              variant='outline'
              className='mt-4 rounded-xl'
              onClick={() => {
                expensesQuery.refetch()
                roomQuery.refetch()
              }}
            >
              <RefreshCcw className='size-4' />
              Thử lại
            </Button>
          </Card>
        ) : (
          <>
            <section className='space-y-3'>
              <div className='flex items-end justify-between gap-3'>
                <div>
                  <h2 className='flex items-center gap-2 text-lg font-bold'>
                    <FileClock className='size-5 text-tertiary' />
                    Đơn nháp
                  </h2>
                  <p className='mt-0.5 text-xs text-muted-foreground'>Lưu riêng, chưa cộng vào công nợ.</p>
                </div>
                <Badge variant='outline' className='rounded-full'>
                  {drafts.length} đơn
                </Badge>
              </div>

              {drafts.length ? (
                <div className='grid gap-3 lg:grid-cols-2'>
                  {drafts.map((expense) => {
                    const itemsTotal = expense.items.reduce((sum, item) => sum + Number(item.total_amount), 0)
                    const expenseTotal = Number(expense.total_amount)
                    const progress = expenseTotal ? Math.min(100, Math.round((itemsTotal / expenseTotal) * 100)) : 0
                    const isReady =
                      expense.items.length > 0 &&
                      itemsTotal === expenseTotal &&
                      expense.items.every((item) => item.splits.length > 0)
                    const participantCount = getExpenseMemberTotals(expense).size

                    return (
                      <Card key={expense.id} className='rounded-3xl border-tertiary/15 p-4 sm:p-5'>
                        <div className='flex items-start gap-3'>
                          <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-tertiary/10 text-tertiary'>
                            <Clock3 className='size-5' />
                          </span>
                          <div className='min-w-0 flex-1'>
                            <p className='truncate font-bold'>{expense.title}</p>
                            <p className='mt-0.5 text-xs text-muted-foreground'>
                              {expense.items.length} món • {participantCount} người đã chia
                            </p>
                          </div>
                          <p className='shrink-0 text-sm font-bold tabular-nums'>{formatVnd(expense.total_amount)}</p>
                        </div>

                        <div className='mt-4'>
                          <div className='mb-1.5 flex justify-between text-[11px] text-muted-foreground'>
                            <span>Đã nhập {formatVnd(itemsTotal)}</span>
                            <span>{progress}%</span>
                          </div>
                          <div className='h-2 overflow-hidden rounded-full bg-muted'>
                            <div
                              className='h-full rounded-full bg-tertiary transition-[width]'
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className='mt-4 flex gap-2 border-t pt-3'>
                          <Button asChild size='sm' className='h-10 flex-1 rounded-xl'>
                            <Link
                              href={`${isReady ? PATHS.EXPENSES.CONFIRM : PATHS.EXPENSES.SPLIT}?expenseId=${expense.id}`}
                            >
                              {isReady ? 'Kiểm tra & chốt' : 'Tiếp tục chia'}
                              <ArrowRight className='size-3.5' />
                            </Link>
                          </Button>
                          <Button
                            type='button'
                            variant='outline'
                            size='icon'
                            className='size-10 rounded-xl text-destructive'
                            disabled={cancelDraft.isPending}
                            aria-label={`Bỏ đơn nháp ${expense.title}`}
                            onClick={() => {
                              if (window.confirm(`Bỏ đơn nháp “${expense.title}”?`)) {
                                cancelDraft.mutate(expense.id)
                              }
                            }}
                          >
                            {cancelDraft.isPending ? (
                              <Loader2 className='size-4 animate-spin' />
                            ) : (
                              <Trash2 className='size-4' />
                            )}
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <Card className='rounded-3xl border-dashed p-7 text-center'>
                  <FileClock className='mx-auto size-8 text-primary' />
                  <p className='mt-3 font-semibold'>Không có đơn nháp đang chờ</p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Bạn có thể lưu hóa đơn trước rồi quay lại chia sau.
                  </p>
                </Card>
              )}
            </section>

            <section className='space-y-3'>
              <div className='flex items-end justify-between gap-3'>
                <div>
                  <h2 className='flex items-center gap-2 text-lg font-bold'>
                    <CheckCircle2 className='size-5 text-secondary' />
                    Khoản chi đã chốt
                  </h2>
                  <p className='mt-0.5 text-xs text-muted-foreground'>Mở từng khoản để xem mỗi người chịu bao nhiêu.</p>
                </div>
                <Badge variant='outline' className='rounded-full'>
                  {postedExpenses.length} khoản
                </Badge>
              </div>

              {postedExpenses.length ? (
                <div className='space-y-3'>
                  {postedExpenses.map((expense) => {
                    const payer = membersById.get(expense.paid_by_member_id)
                    const memberTotals = getExpenseMemberTotals(expense)
                    return (
                      <Card key={expense.id} className='rounded-3xl p-4 sm:p-5'>
                        <div className='flex items-start gap-3'>
                          <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-secondary/10 text-secondary'>
                            <ReceiptText className='size-5' />
                          </span>
                          <div className='min-w-0 flex-1'>
                            <p className='truncate font-bold'>{expense.title}</p>
                            <p className='mt-0.5 text-xs text-muted-foreground'>
                              {expense.items.length} món • {new Date(expense.expense_date).toLocaleDateString('vi-VN')}{' '}
                              • {payer?.nickname || payer?.display_name || 'Thành viên'} đã trả
                            </p>
                          </div>
                          <p className='shrink-0 text-sm font-bold tabular-nums'>{formatVnd(expense.total_amount)}</p>
                        </div>

                        <details className='group mt-4 border-t pt-3'>
                          <summary className='flex min-h-11 list-none items-center gap-2 text-sm font-semibold text-primary'>
                            <UsersRound className='size-4' />
                            Xem phần chia của {memberTotals.size} người
                            <ArrowRight className='ml-auto size-4 transition-transform group-open:rotate-90' />
                          </summary>
                          <div className='mt-2 grid gap-2 sm:grid-cols-2'>
                            {Array.from(memberTotals.entries()).map(([memberId, amount]) => {
                              const member = membersById.get(memberId)
                              const memberName = member?.nickname || member?.display_name || 'Thành viên'
                              return (
                                <div
                                  key={memberId}
                                  className='flex items-center gap-2 rounded-xl bg-muted/55 px-3 py-2'
                                >
                                  <span className='grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary'>
                                    {memberName.charAt(0).toUpperCase()}
                                  </span>
                                  <span className='min-w-0 flex-1 truncate text-xs font-semibold'>{memberName}</span>
                                  <span className='text-xs font-bold tabular-nums'>{formatVnd(amount)}</span>
                                </div>
                              )
                            })}
                          </div>
                        </details>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <Card className='rounded-3xl border-dashed p-7 text-center'>
                  <ReceiptText className='mx-auto size-8 text-primary' />
                  <p className='mt-3 font-semibold'>Chưa có khoản chi đã chốt</p>
                  <p className='mt-1 text-xs text-muted-foreground'>Hoàn tất phần chia của một đơn nháp để bắt đầu.</p>
                </Card>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export function ExpensesListPage() {
  return (
    <React.Suspense
      fallback={
        <div className='grid min-h-screen place-items-center bg-background'>
          <Loader2 className='size-7 animate-spin text-primary' />
        </div>
      }
    >
      <ExpensesListContent />
    </React.Suspense>
  )
}
