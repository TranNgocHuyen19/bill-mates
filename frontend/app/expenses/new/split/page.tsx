'use client'

import * as React from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, ShoppingBasket, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { Navbar } from '@/components/navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PATHS } from '@/constants'
import {
  ExpenseItemEditor,
  OcrReceiptReview,
  useDeleteExpenseItemMutation,
  useExpenseQuery,
  useExpenseReceiptQuery,
  useExpenseReceiptsQuery,
  useSaveExpenseItemMutation,
  useScanExpenseReceiptMutation,
  type OcrItemSuggestion,
  type SplitMethod
} from '@/features/expenses'
import { useRoomDetailQuery } from '@/features/rooms'
import { formatVnd } from '@/lib/money'
import { cn } from '@/lib/utils'

const methodLabels: Record<SplitMethod, string> = {
  equal: 'Chia đều',
  exact: 'Số tiền chính xác',
  percentage: 'Phần trăm',
  shares: 'Trọng số'
}

function SplitExpenseContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const expenseId = searchParams.get('expenseId') ?? ''
  const requestedReceiptId = searchParams.get('receiptId') ?? ''
  const expenseQuery = useExpenseQuery(expenseId)
  const receiptsQuery = useExpenseReceiptsQuery(expenseId)
  const receiptId = requestedReceiptId || receiptsQuery.data?.[0]?.id || ''
  const receiptQuery = useExpenseReceiptQuery(receiptId)
  const scanReceipt = useScanExpenseReceiptMutation(receiptId)
  const scanReceiptMutate = scanReceipt.mutate
  const roomQuery = useRoomDetailQuery(expenseQuery.data?.room_id ?? '')
  const saveItem = useSaveExpenseItemMutation(expenseId)
  const deleteItem = useDeleteExpenseItemMutation(expenseId)
  const [mode, setMode] = React.useState<'whole' | 'itemized'>('itemized')
  const [ocrSuggestion, setOcrSuggestion] = React.useState<(OcrItemSuggestion & { sourceIndex: number }) | null>(null)
  const [importedOcrIndexes, setImportedOcrIndexes] = React.useState<number[]>([])
  const autoScanReceiptId = React.useRef('')
  const expense = expenseQuery.data
  const activeMembers = roomQuery.data?.members.filter((member) => member.status === 'active') ?? []
  const itemsTotal = expense?.items.reduce((sum, item) => sum + Number(item.total_amount), 0) ?? 0
  const expenseTotal = Number(expense?.total_amount ?? 0)
  const remaining = Math.max(0, expenseTotal - itemsTotal)
  const overBy = Math.max(0, itemsTotal - expenseTotal)
  const membersById = new Map(roomQuery.data?.members.map((member) => [member.id, member]) ?? [])
  const canContinue =
    Boolean(expense?.items.length) &&
    itemsTotal === expenseTotal &&
    expense?.items.every((item) => item.splits.length > 0)

  React.useEffect(() => {
    if (receiptId && receiptQuery.data?.ocr_status === 'not_requested' && autoScanReceiptId.current !== receiptId) {
      autoScanReceiptId.current = receiptId
      scanReceiptMutate(false)
    }
  }, [receiptId, receiptQuery.data?.ocr_status, scanReceiptMutate])

  if (expenseQuery.isPending || roomQuery.isPending) {
    return (
      <div className='grid min-h-screen place-items-center bg-background'>
        <Loader2 className='size-7 animate-spin text-primary' aria-label='Đang tải đơn nháp' />
      </div>
    )
  }

  if (!expense || !roomQuery.data) {
    return (
      <div className='grid min-h-screen place-items-center bg-background px-4'>
        <Card className='max-w-md rounded-2xl p-7 text-center'>
          <p className='font-bold'>Không tìm thấy đơn nháp</p>
          <Button asChild className='mt-4 rounded-xl'>
            <Link href={PATHS.ROOMS}>Về danh sách phòng</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background pb-28 text-foreground'>
      <Navbar />
      <main className='mx-auto w-full max-w-3xl space-y-5 px-4 py-5 sm:py-8'>
        <div className='flex items-center justify-between'>
          <Link
            href={`${PATHS.EXPENSES.INDEX}?roomId=${expense.room_id}`}
            className='inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground'
          >
            <ArrowLeft className='size-4' />
            Đơn nháp
          </Link>
          <span className='rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary'>Bước 2 / 3</span>
        </div>

        <header>
          <p className='text-xs font-semibold tracking-[0.16em] text-primary uppercase'>Món & người chia</p>
          <h1 className='mt-1 text-2xl font-bold tracking-tight'>{expense.title}</h1>
          <div className='mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
            <Badge variant='outline'>Đơn nháp</Badge>
            <span>Tổng hóa đơn: </span>
            <strong className='text-foreground'>{formatVnd(expense.total_amount)}</strong>
          </div>
        </header>

        <div className='grid grid-cols-3 gap-2' aria-label='Tiến trình tạo khoản chi'>
          <div className='h-1.5 rounded-full bg-primary' />
          <div className='h-1.5 rounded-full bg-primary' />
          <div className='h-1.5 rounded-full bg-primary/15' />
        </div>

        <Card className='grid grid-cols-2 gap-3 rounded-2xl p-4 sm:grid-cols-3'>
          <div className='min-w-0'>
            <p className='text-[11px] text-muted-foreground uppercase'>Đã nhập</p>
            <p className='mt-1 truncate text-sm font-bold tabular-nums sm:text-base'>{formatVnd(itemsTotal)}</p>
          </div>
          <div className='min-w-0'>
            <p className='text-[11px] text-muted-foreground uppercase'>{overBy ? 'Vượt quá' : 'Còn lại'}</p>
            <p
              className={cn(
                'mt-1 truncate text-sm font-bold tabular-nums sm:text-base',
                overBy ? 'text-destructive' : remaining ? 'text-tertiary' : 'text-secondary'
              )}
            >
              {formatVnd(overBy || remaining)}
            </p>
          </div>
          <div className='col-span-2 min-w-0 sm:col-span-1'>
            <p className='text-[11px] text-muted-foreground uppercase'>Số món</p>
            <p className='mt-1 font-bold'>{expense.items.length}</p>
          </div>
        </Card>

        {receiptQuery.isPending && receiptId ? (
          <Card className='flex items-center gap-3 rounded-2xl border-primary/20 bg-primary/5 p-4' role='status'>
            <Loader2 className='size-5 animate-spin text-primary' />
            <div>
              <p className='text-sm font-bold'>Đang tải kết quả quét bill</p>
              <p className='text-xs text-muted-foreground'>Kết quả đã được lưu cùng đơn nháp.</p>
            </div>
          </Card>
        ) : null}

        {receiptQuery.isError ? (
          <Card className='rounded-2xl border-destructive/25 bg-destructive/5 p-4' role='alert'>
            <p className='text-sm font-bold'>Không tải được kết quả OCR</p>
            <button
              type='button'
              className='mt-2 min-h-10 text-xs font-semibold text-primary'
              onClick={() => receiptQuery.refetch()}
            >
              Thử tải lại
            </button>
          </Card>
        ) : null}

        {receiptQuery.data ? (
          <OcrReceiptReview
            key={receiptQuery.data.updated_at}
            receipt={receiptQuery.data}
            expenseTotal={expenseTotal}
            selectedIndex={ocrSuggestion?.sourceIndex ?? null}
            importedIndexes={importedOcrIndexes}
            isRetrying={scanReceipt.isPending}
            onRetry={() => scanReceiptMutate(true)}
            onUseSuggestion={(suggestion) => {
              setMode('itemized')
              setOcrSuggestion(suggestion)
              requestAnimationFrame(() => {
                document.getElementById('expense-item-editor')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                })
              })
            }}
          />
        ) : null}

        {expense.items.length > 0 && (
          <section className='space-y-2'>
            <h2 className='font-bold'>Món đã lưu</h2>
            {expense.items.map((item) => (
              <Card key={item.id} className='rounded-2xl p-4'>
                <div className='flex items-center gap-3'>
                  <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-secondary/10 text-secondary'>
                    <CheckCircle2 className='size-5' />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-bold'>{item.name}</p>
                    <p className='mt-0.5 text-xs text-muted-foreground'>
                      {item.splits.length} người •{' '}
                      {item.splits[0] ? methodLabels[item.splits[0].split_method] : 'Chưa chia'}
                    </p>
                  </div>
                  <div className='shrink-0 text-right'>
                    <p className='text-sm font-bold'>{formatVnd(item.total_amount)}</p>
                    <button
                      type='button'
                      className='mt-1 inline-flex min-h-8 items-center gap-1 text-xs text-destructive'
                      onClick={() => deleteItem.mutate(item.id)}
                      disabled={deleteItem.isPending}
                    >
                      <Trash2 className='size-3.5' />
                      Xóa
                    </button>
                  </div>
                </div>

                {item.splits.length > 0 ? (
                  <div className='mt-3 grid gap-2 border-t pt-3 sm:grid-cols-2'>
                    {item.splits.map((split) => {
                      const member = membersById.get(split.member_id)
                      const memberName = member?.nickname || member?.display_name || 'Thành viên'
                      return (
                        <div
                          key={split.id}
                          className='flex items-center gap-2 rounded-xl bg-muted/55 px-3 py-2 text-xs'
                        >
                          <span className='grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary'>
                            {memberName.charAt(0).toUpperCase()}
                          </span>
                          <span className='min-w-0 flex-1 truncate font-semibold'>{memberName}</span>
                          <span className='font-bold tabular-nums'>{formatVnd(split.amount_owed)}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className='mt-3 border-t pt-3 text-xs text-tertiary'>Món này chưa có người được chia.</p>
                )}
              </Card>
            ))}
          </section>
        )}

        {remaining > 0 && (
          <section className='space-y-3'>
            <div className='grid grid-cols-2 rounded-2xl bg-muted p-1'>
              <button
                className={cn(
                  'min-h-11 rounded-xl text-sm font-semibold transition',
                  mode === 'itemized' && 'bg-card text-primary shadow-sm'
                )}
                onClick={() => {
                  setMode('itemized')
                  setOcrSuggestion(null)
                }}
                aria-pressed={mode === 'itemized'}
              >
                Theo từng món
              </button>
              <button
                className={cn(
                  'min-h-11 rounded-xl text-sm font-semibold transition',
                  mode === 'whole' && 'bg-card text-primary shadow-sm'
                )}
                onClick={() => {
                  setMode('whole')
                  setOcrSuggestion(null)
                }}
                aria-pressed={mode === 'whole'}
              >
                Chia nhanh toàn bill
              </button>
            </div>

            <p className='rounded-xl bg-primary/5 px-3 py-2 text-xs leading-5 text-muted-foreground'>
              {mode === 'itemized'
                ? 'Thêm nhiều món; mỗi món chọn người dùng và cách chia riêng.'
                : 'Tạo một món đại diện cho toàn bộ số tiền còn lại của hóa đơn.'}
            </p>

            <div id='expense-item-editor'>
              <ExpenseItemEditor
                key={`${mode}-${expense.items.length}-${ocrSuggestion?.sourceIndex ?? 'manual'}`}
                members={activeMembers}
                defaultName={ocrSuggestion?.name ?? (mode === 'whole' ? 'Toàn bộ hóa đơn' : '')}
                defaultAmount={ocrSuggestion?.total_amount ?? (mode === 'whole' ? remaining : undefined)}
                isPending={saveItem.isPending}
                onSave={({
                  name,
                  amount,
                  method,
                  participants
                }: {
                  name: string
                  amount: number
                  method: SplitMethod
                  participants: Array<{ member_id: string; share_value?: number | null }>
                }) =>
                  saveItem.mutate(
                    {
                      item: {
                        expenseId,
                        name,
                        unit_price: amount,
                        position: expense.items.length
                      },
                      split: { method, splits: participants }
                    },
                    {
                      onSuccess: () => {
                        if (ocrSuggestion) {
                          setImportedOcrIndexes((current) => [...current, ocrSuggestion.sourceIndex])
                        }
                        setOcrSuggestion(null)
                      }
                    }
                  )
                }
              />
            </div>
          </section>
        )}

        {overBy > 0 && (
          <Card className='rounded-2xl border-destructive/30 bg-destructive/5 p-4 text-destructive'>
            <p className='text-sm font-bold'>Tổng các món đang vượt hóa đơn {formatVnd(overBy)}</p>
            <p className='mt-1 text-xs'>Xóa món bị nhập dư rồi thêm lại với số tiền đúng để tiếp tục.</p>
          </Card>
        )}

        {itemsTotal === expenseTotal && (
          <Card className='rounded-2xl border-secondary/25 bg-secondary/5 p-4'>
            <div className='flex items-center gap-3'>
              <ShoppingBasket className='size-5 text-secondary' />
              <div>
                <p className='text-sm font-bold'>Tổng các món đã khớp hóa đơn</p>
                <p className='text-xs text-muted-foreground'>Bạn có thể sang bước kiểm tra cuối.</p>
              </div>
            </div>
          </Card>
        )}

        <div className='sticky bottom-20 z-20 rounded-2xl border bg-card/95 p-3 shadow-xl backdrop-blur sm:bottom-4'>
          <Button
            className='h-12 w-full rounded-xl'
            disabled={!canContinue}
            onClick={() => router.push(`${PATHS.EXPENSES.CONFIRM}?expenseId=${expense.id}`)}
          >
            Kiểm tra khoản chi
            <ArrowRight className='size-4' />
          </Button>
        </div>
      </main>
    </div>
  )
}

export default function SplitExpensePage() {
  return (
    <React.Suspense
      fallback={
        <div className='grid min-h-screen place-items-center'>
          <Loader2 className='size-6 animate-spin text-primary' />
        </div>
      }
    >
      <SplitExpenseContent />
    </React.Suspense>
  )
}
