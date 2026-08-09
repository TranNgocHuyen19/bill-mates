'use client'

import * as React from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, FileText, Loader2, ReceiptText, Save, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PATHS } from '@/constants'
import { scanExpenseReceiptApi, uploadExpenseReceiptApi, useCreateExpenseDraftMutation } from '../index'
import { useRoomDetailQuery, useRoomsQuery } from '@/features/rooms'
import { getErrorMessage } from '@/lib/error-handler'
import { showErrorToast } from '@/lib/toast'
import { MoneyInput } from './money-input'
import { OcrUploadCard, type ReceiptUploadStage } from './ocr-upload-card'

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function ExpenseCreateFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedRoomId = searchParams.get('roomId') ?? ''
  const roomsQuery = useRoomsQuery()
  const [selectedRoomId, setSelectedRoomId] = React.useState(requestedRoomId)
  const [selectedPayerId, setSelectedPayerId] = React.useState('')
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null)
  const [receiptStage, setReceiptStage] = React.useState<ReceiptUploadStage>('idle')
  const roomId = selectedRoomId || requestedRoomId || roomsQuery.data?.[0]?.id || ''
  const roomQuery = useRoomDetailQuery(roomId)
  const createDraft = useCreateExpenseDraftMutation()
  const activeMembers = roomQuery.data?.members.filter((member) => member.status === 'active') ?? []
  const isSaving = createDraft.isPending || receiptStage !== 'idle'

  return (
    <div className='min-h-screen bg-background pb-24 text-foreground'>
      <Navbar />
      <main className='mx-auto w-full max-w-2xl space-y-5 px-4 py-5 sm:py-8'>
        <div className='flex items-center justify-between'>
          <Link
            href={roomId ? PATHS.ROOM_DETAIL(roomId) : PATHS.ROOMS}
            className='inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground'
          >
            <ArrowLeft className='size-4' />
            Quay lại
          </Link>
          <span className='rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary'>Bước 1 / 3</span>
        </div>

        <header>
          <p className='text-xs font-semibold tracking-[0.16em] text-primary uppercase'>Khoản chi mới</p>
          <h1 className='mt-1 text-2xl font-bold tracking-tight'>Thông tin hóa đơn</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Bước này tạo một đơn nháp trên server, chưa ảnh hưởng công nợ.
          </p>
        </header>

        <div className='grid grid-cols-3 gap-2' aria-label='Tiến trình tạo khoản chi'>
          <div className='h-1.5 rounded-full bg-primary' />
          <div className='h-1.5 rounded-full bg-primary/15' />
          <div className='h-1.5 rounded-full bg-primary/15' />
        </div>

        <Card className='rounded-3xl p-4 sm:p-6'>
          <form
            className='space-y-5'
            onSubmit={(event) => {
              event.preventDefault()
              const form = new FormData(event.currentTarget)
              const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
              const shouldContinue = submitter?.value !== 'save'
              createDraft.mutate(
                {
                  roomId,
                  title: String(form.get('title')).trim(),
                  total_amount: Number(form.get('total_amount')),
                  paid_by_member_id: String(form.get('paid_by_member_id')),
                  expense_date: String(form.get('expense_date')),
                  note: String(form.get('note')).trim() || undefined
                },
                {
                  onSuccess: async (expense) => {
                    let receiptId = ''
                    if (receiptFile) {
                      try {
                        setReceiptStage('uploading')
                        const receipt = await uploadExpenseReceiptApi(expense.id, receiptFile)
                        receiptId = receipt.id
                        setReceiptStage('scanning')
                        await scanExpenseReceiptApi(receipt.id)
                      } catch (error) {
                        const action = receiptId ? 'PaddleOCR chưa đọc được ảnh' : 'ảnh tải lên thất bại'
                        showErrorToast(`Đơn nháp đã lưu nhưng ${action}: ${getErrorMessage(error)}`)
                      } finally {
                        setReceiptStage('idle')
                      }
                    }
                    router.push(
                      shouldContinue
                        ? `${PATHS.EXPENSES.SPLIT}?expenseId=${expense.id}${receiptId ? `&receiptId=${receiptId}` : ''}`
                        : `${PATHS.EXPENSES.INDEX}?roomId=${expense.room_id}`
                    )
                  }
                }
              )
            }}
          >
            <div className='min-w-0 space-y-1.5'>
              <label className='block text-xs font-semibold text-muted-foreground' htmlFor='expense-room'>
                Phòng
              </label>
              <Select
                value={roomId}
                onValueChange={(value) => {
                  setSelectedRoomId(value)
                  setSelectedPayerId('')
                }}
                required
              >
                <SelectTrigger id='expense-room' className='w-full'>
                  <UsersRound className='size-4 text-muted-foreground' />
                  <SelectValue placeholder='Chọn phòng' />
                </SelectTrigger>
                <SelectContent>
                  {roomsQuery.data?.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      <span className='block min-w-0 truncate'>{room.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input
              name='title'
              label='Tên khoản chi'
              placeholder='Ví dụ: Đi chợ cuối tuần'
              icon={<ReceiptText className='size-4' />}
              minLength={1}
              required
            />
            <MoneyInput name='total_amount' label='Tổng tiền (VND)' placeholder='0' required />

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='min-w-0 space-y-1.5'>
                <label className='block text-xs font-semibold text-muted-foreground' htmlFor='expense-payer'>
                  Người đã trả
                </label>
                <Select name='paid_by_member_id' value={selectedPayerId} onValueChange={setSelectedPayerId} required>
                  <SelectTrigger id='expense-payer' className='w-full'>
                    <SelectValue placeholder='Chọn người trả' />
                  </SelectTrigger>
                  <SelectContent>
                    {activeMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <span className='block min-w-0 truncate'>{member.nickname || member.display_name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                name='expense_date'
                type='date'
                label='Ngày chi'
                trailingIcon={<CalendarDays className='size-4 text-primary' />}
                defaultValue={toLocalIsoDate(new Date())}
                className='cursor-pointer pr-12 text-base font-medium tabular-nums [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0'
                required
              />
            </div>

            <Input
              name='note'
              label='Ghi chú (không bắt buộc)'
              placeholder='Thông tin giúp mọi người dễ nhận biết'
              icon={<FileText className='size-4' />}
            />

            <OcrUploadCard
              key={receiptFile ? `${receiptFile.name}-${receiptFile.lastModified}` : 'empty-receipt'}
              file={receiptFile}
              stage={receiptStage}
              disabled={createDraft.isPending}
              onFileChange={(file) => {
                if (file && file.size > 10 * 1024 * 1024) {
                  showErrorToast('Ảnh hóa đơn phải nhỏ hơn 10 MB.')
                  setReceiptFile(null)
                  return
                }
                setReceiptFile(file)
              }}
            />

            <div className='grid grid-cols-[0.85fr_1.15fr] gap-3'>
              <Button
                type='submit'
                name='intent'
                value='save'
                variant='outline'
                className='h-12 rounded-xl font-semibold'
                disabled={isSaving || !roomId || !activeMembers.length}
              >
                <Save className='size-4' />
                <span className='hidden min-[360px]:inline'>Lưu nháp</span>
                <span className='min-[360px]:hidden'>Lưu</span>
              </Button>
              <Button
                type='submit'
                name='intent'
                value='continue'
                className='h-12 rounded-xl font-semibold'
                disabled={isSaving || !roomId || !activeMembers.length}
              >
                {isSaving ? <Loader2 className='size-4 animate-spin' /> : <ArrowRight className='size-4' />}
                {receiptStage === 'scanning' ? 'Đang quét...' : isSaving ? 'Đang lưu...' : 'Tiếp tục chia'}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  )
}

export function ExpenseCreatePage() {
  return (
    <React.Suspense
      fallback={
        <div className='grid min-h-screen place-items-center'>
          <Loader2 className='size-6 animate-spin text-primary' />
        </div>
      }
    >
      <ExpenseCreateFormContent />
    </React.Suspense>
  )
}
