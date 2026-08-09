'use client'

import * as React from 'react'
import { ArrowLeft, CheckCircle2, Clock3, Loader2, ReceiptText, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { Navbar } from '@/components/navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PATHS } from '@/constants'
import { useExpenseQuery, usePostExpenseMutation } from '@/features/expenses'
import { useRoomDetailQuery } from '@/features/rooms'
import { formatVnd } from '@/lib/money'

function ConfirmExpenseContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const expenseId = searchParams.get('expenseId') ?? ''
  const expenseQuery = useExpenseQuery(expenseId)
  const roomQuery = useRoomDetailQuery(expenseQuery.data?.room_id ?? '')
  const postExpense = usePostExpenseMutation(expenseId)
  const expense = expenseQuery.data
  const room = roomQuery.data
  const membersById = new Map(room?.members.map((member) => [member.id, member]) ?? [])

  if (expenseQuery.isPending || roomQuery.isPending) {
    return (
      <div className='grid min-h-screen place-items-center bg-background'>
        <Loader2 className='size-7 animate-spin text-primary' aria-label='Đang kiểm tra khoản chi' />
      </div>
    )
  }

  if (!expense || !room) {
    return (
      <div className='grid min-h-screen place-items-center bg-background px-4'>
        <Card className='rounded-2xl p-7 text-center'>
          <p className='font-bold'>Không tìm thấy khoản chi cần xác nhận.</p>
          <Button asChild className='mt-4 rounded-xl'>
            <Link href={PATHS.ROOMS}>Về danh sách phòng</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const payer = membersById.get(expense.paid_by_member_id)
  const isPosted = expense.status === 'posted'

  return (
    <div className='min-h-screen bg-background pb-28 text-foreground'>
      <Navbar />
      <main className='mx-auto w-full max-w-3xl space-y-5 px-4 py-5 sm:py-8'>
        <div className='flex items-center justify-between'>
          <Link
            href={`${PATHS.EXPENSES.SPLIT}?expenseId=${expense.id}`}
            className='inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground'
          >
            <ArrowLeft className='size-4' />
            Bước 2
          </Link>
          <span className='rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary'>Bước 3 / 3</span>
        </div>

        <header>
          <p className='text-xs font-semibold tracking-[0.16em] text-primary uppercase'>Kiểm tra cuối</p>
          <h1 className='mt-1 text-2xl font-bold tracking-tight'>Xác nhận khoản chi</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Chỉ khi bấm “Chốt khoản chi”, số tiền mới được cộng vào công nợ.
          </p>
        </header>

        <div className='grid grid-cols-3 gap-2' aria-label='Tiến trình tạo khoản chi'>
          <div className='h-1.5 rounded-full bg-primary' />
          <div className='h-1.5 rounded-full bg-primary' />
          <div className='h-1.5 rounded-full bg-primary' />
        </div>

        <Card className='overflow-hidden rounded-3xl p-0'>
          <div className='bg-primary p-5 text-white sm:p-6'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <Badge className='border-white/20 bg-white/15 text-white hover:bg-white/15'>
                  {isPosted ? 'Đã chốt' : 'Đơn nháp'}
                </Badge>
                <h2 className='mt-3 text-xl font-bold'>{expense.title}</h2>
                <p className='mt-1 text-sm text-white/70'>{room.name}</p>
              </div>
              <ReceiptText className='size-8 text-white/60' />
            </div>
            <p className='mt-6 text-3xl font-bold'>{formatVnd(expense.total_amount)}</p>
          </div>
          <div className='grid grid-cols-2 gap-4 p-5 text-sm'>
            <div>
              <p className='text-xs text-muted-foreground'>Người đã trả</p>
              <p className='mt-1 font-bold'>{payer?.nickname || payer?.display_name}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Ngày chi</p>
              <p className='mt-1 font-bold'>
                {new Intl.DateTimeFormat('vi-VN').format(new Date(expense.expense_date))}
              </p>
            </div>
          </div>
        </Card>

        <section className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h2 className='font-bold'>Chi tiết từng món</h2>
            <span className='text-xs text-muted-foreground'>{expense.items.length} món</span>
          </div>
          {expense.items.map((item) => (
            <Card key={item.id} className='rounded-2xl p-4'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p className='font-bold'>{item.name}</p>
                  <p className='mt-0.5 text-xs text-muted-foreground'>{item.splits.length} người tham gia</p>
                </div>
                <p className='font-bold'>{formatVnd(item.total_amount)}</p>
              </div>
              <div className='mt-3 space-y-2 border-t pt-3'>
                {item.splits.map((split) => {
                  const member = membersById.get(split.member_id)
                  return (
                    <div key={split.id} className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>
                        {member?.nickname || member?.display_name || 'Thành viên'}
                      </span>
                      <span className='font-semibold'>{formatVnd(split.amount_owed)}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          ))}
        </section>

        <Card className='rounded-2xl border-secondary/20 bg-secondary/5 p-4'>
          <div className='flex gap-3'>
            <ShieldCheck className='size-5 shrink-0 text-secondary' />
            <div>
              <p className='text-sm font-bold'>Kiểm tra giao dịch an toàn</p>
              <p className='mt-1 text-xs leading-5 text-muted-foreground'>
                Backend sẽ kiểm tra lại tổng món, tổng phần chia và membership trong một transaction.
              </p>
            </div>
          </div>
        </Card>

        <div className='sticky bottom-20 z-20 grid grid-cols-[0.8fr_1.2fr] gap-3 rounded-2xl border bg-card/95 p-3 shadow-xl backdrop-blur sm:bottom-4'>
          <Button variant='outline' className='h-12 rounded-xl' asChild>
            <Link href={`${PATHS.EXPENSES.INDEX}?roomId=${expense.room_id}`}>
              <Clock3 className='size-4' />
              {isPosted ? 'Danh sách' : 'Để nháp'}
            </Link>
          </Button>
          <Button
            className='h-12 rounded-xl'
            disabled={postExpense.isPending || isPosted}
            onClick={() =>
              postExpense.mutate(undefined, {
                onSuccess: () => router.replace(PATHS.ROOM_DETAIL(expense.room_id))
              })
            }
          >
            {postExpense.isPending ? <Loader2 className='size-4 animate-spin' /> : <CheckCircle2 className='size-4' />}
            {isPosted ? 'Đã chốt' : postExpense.isPending ? 'Đang chốt...' : 'Chốt khoản chi'}
          </Button>
        </div>
      </main>
    </div>
  )
}

export default function ConfirmExpensePage() {
  return (
    <React.Suspense
      fallback={
        <div className='grid min-h-screen place-items-center'>
          <Loader2 className='size-6 animate-spin text-primary' />
        </div>
      }
    >
      <ConfirmExpenseContent />
    </React.Suspense>
  )
}
