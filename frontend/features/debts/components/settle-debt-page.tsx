'use client'

import * as React from 'react'
import { ArrowLeft, FileImage, Loader2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PATHS } from '@/constants'
import { VietQRCard, uploadSettlementReceiptApi, useBalancesQuery, useCreateSettlementMutation } from '../index'
import { getErrorMessage } from '@/lib/error-handler'
import { showErrorToast } from '@/lib/toast'

function SettleDebtContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomId = searchParams.get('roomId') ?? ''
  const toMemberId = searchParams.get('toMemberId') ?? ''
  const requestedAmount = Number(searchParams.get('amount') ?? 0)
  const balancesQuery = useBalancesQuery(roomId)
  const createSettlement = useCreateSettlementMutation(roomId)
  const [receipt, setReceipt] = React.useState<File | null>(null)
  const suggestion = balancesQuery.data?.suggestions.find(
    (item) =>
      item.from_member_id === balancesQuery.data.current_member_id &&
      item.to_member_id === toMemberId &&
      Number(item.amount) === requestedAmount
  )
  const content = `BILLMATES ${roomId.slice(0, 6).toUpperCase()}`

  const submit = async () => {
    if (!suggestion) return
    const settlement = await createSettlement.mutateAsync({
      roomId,
      to_member_id: suggestion.to_member_id,
      amount: Number(suggestion.amount),
      method: suggestion.payment_account ? 'bank_transfer' : 'cash',
      payment_account_id: suggestion.payment_account?.id,
      reference: content
    })
    if (receipt) {
      try {
        await uploadSettlementReceiptApi(settlement.id, receipt)
      } catch (error) {
        showErrorToast(`Thanh toán đã được lưu nhưng ảnh chưa tải lên: ${getErrorMessage(error)}`)
      }
    }
    router.push(`${PATHS.DEBTS.INDEX}?roomId=${roomId}`)
  }

  if (balancesQuery.isPending) {
    return (
      <div className='grid min-h-screen place-items-center bg-background'>
        <Loader2 className='size-7 animate-spin text-primary' aria-label='Đang tải thanh toán' />
      </div>
    )
  }

  if (!suggestion) {
    return (
      <div className='min-h-screen bg-background'>
        <Navbar />
        <main className='mx-auto max-w-lg px-4 py-10'>
          <Card className='rounded-3xl p-7 text-center'>
            <ShieldCheck className='mx-auto size-10 text-secondary' />
            <h1 className='mt-4 text-xl font-bold'>Khoản công nợ đã thay đổi</h1>
            <p className='mt-2 text-sm text-muted-foreground'>Hãy quay lại để lấy gợi ý thanh toán mới nhất.</p>
            <Button asChild className='mt-5 rounded-xl'>
              <Link href={`${PATHS.DEBTS.INDEX}?roomId=${roomId}`}>Về trang công nợ</Link>
            </Button>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background pb-24 text-foreground'>
      <Navbar />
      <main className='mx-auto w-full max-w-xl space-y-5 px-4 py-5 sm:py-8'>
        <Button variant='ghost' size='sm' className='-ml-2 rounded-xl' asChild>
          <Link href={`${PATHS.DEBTS.INDEX}?roomId=${roomId}`}>
            <ArrowLeft className='size-4' /> Quay lại công nợ
          </Link>
        </Button>

        <header className='text-center'>
          <p className='text-xs font-bold tracking-[0.16em] text-primary uppercase'>Thanh toán an toàn</p>
          <h1 className='mt-1 text-2xl font-bold'>Trả cho {suggestion.to_name}</h1>
          <p className='mt-2 text-sm text-muted-foreground'>
            Quét QR, tải minh chứng nếu cần rồi gửi yêu cầu xác nhận.
          </p>
        </header>

        <VietQRCard
          account={suggestion.payment_account}
          amount={Number(suggestion.amount)}
          content={content}
          onConfirm={submit}
          isConfirming={createSettlement.isPending}
        />

        <Card className='rounded-2xl p-4'>
          <label className='flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 transition hover:border-primary'>
            <FileImage className='size-5 text-primary' />
            <span className='min-w-0 flex-1'>
              <span className='block text-sm font-bold'>Ảnh minh chứng chuyển tiền</span>
              <span className='block truncate text-xs text-muted-foreground'>
                {receipt?.name ?? 'Không bắt buộc · JPEG, PNG hoặc WebP · tối đa 10 MB'}
              </span>
            </span>
            <input
              type='file'
              accept='image/jpeg,image/png,image/webp'
              className='sr-only'
              onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
            />
          </label>
        </Card>
      </main>
    </div>
  )
}

export function SettleDebtPage() {
  return (
    <React.Suspense
      fallback={
        <div className='grid min-h-screen place-items-center bg-background'>
          <Loader2 className='size-7 animate-spin text-primary' />
        </div>
      }
    >
      <SettleDebtContent />
    </React.Suspense>
  )
}
