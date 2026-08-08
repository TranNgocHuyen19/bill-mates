'use client'

import { CheckCircle2, Copy, Landmark, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatVnd } from '@/lib/money'
import { showSuccessToast } from '@/lib/toast'
import type { PaymentAccountSummary } from '../api'

export interface VietQRCardProps {
  account: PaymentAccountSummary | null
  amount: number
  content: string
  onConfirm: () => void
  isConfirming?: boolean
}

export function VietQRCard({ account, amount, content, onConfirm, isConfirming = false }: VietQRCardProps) {
  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    showSuccessToast(`Đã sao chép ${label}.`)
  }
  const hasBankDetails = Boolean(account?.bank_code && account.account_number)
  const qrUrl = hasBankDetails
    ? `https://img.vietqr.io/image/${encodeURIComponent(account!.bank_code!)}-${encodeURIComponent(
        account!.account_number!
      )}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(
        account?.account_name ?? ''
      )}`
    : null

  return (
    <Card className='space-y-5 rounded-3xl border-primary/20 p-5 text-center shadow-lg sm:p-7'>
      {qrUrl ? (
        <div className='mx-auto w-fit rounded-2xl border bg-white p-3 shadow-sm'>
          {/* VietQR returns a ready-to-scan PNG for the recipient's configured account. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt={`Mã VietQR chuyển tiền tới ${account?.account_name ?? 'người nhận'}`}
            className='size-64 max-w-full object-contain'
          />
        </div>
      ) : (
        <div className='mx-auto grid size-56 place-items-center rounded-3xl border border-dashed bg-muted/40 p-6'>
          <div>
            <Landmark className='mx-auto size-10 text-primary' />
            <p className='mt-3 text-sm font-bold'>Người nhận chưa có tài khoản mặc định</p>
            <p className='mt-1 text-xs text-muted-foreground'>Bạn vẫn có thể ghi nhận thanh toán tiền mặt.</p>
          </div>
        </div>
      )}

      <div>
        <p className='text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase'>Số tiền cần chuyển</p>
        <p className='mt-1 text-3xl font-bold text-primary'>{formatVnd(amount)}</p>
      </div>

      {account && (
        <div className='space-y-3 rounded-2xl bg-muted/50 p-4 text-left text-sm'>
          <div className='flex items-start justify-between gap-4'>
            <span className='text-muted-foreground'>Ngân hàng</span>
            <strong className='text-right'>{account.bank_name ?? account.label}</strong>
          </div>
          {account.account_number && (
            <div className='flex items-start justify-between gap-4'>
              <span className='text-muted-foreground'>Số tài khoản</span>
              <button
                className='inline-flex min-h-8 items-center gap-1 font-mono font-bold text-primary'
                onClick={() => copy(account.account_number!, 'số tài khoản')}
              >
                {account.account_number}
                <Copy className='size-3.5' />
              </button>
            </div>
          )}
          <div className='flex items-start justify-between gap-4'>
            <span className='text-muted-foreground'>Chủ tài khoản</span>
            <strong className='text-right uppercase'>{account.account_name ?? 'Chưa cập nhật'}</strong>
          </div>
          <div className='flex items-start justify-between gap-4 border-t pt-3'>
            <span className='text-muted-foreground'>Nội dung</span>
            <button
              className='inline-flex min-h-8 max-w-[70%] items-center gap-1 text-right font-mono text-xs font-bold text-primary'
              onClick={() => copy(content, 'nội dung')}
            >
              {content}
              <Copy className='size-3.5 shrink-0' />
            </button>
          </div>
        </div>
      )}

      <Button
        onClick={onConfirm}
        disabled={isConfirming}
        className='h-12 w-full gap-2 rounded-2xl shadow-md shadow-primary/20'
      >
        {isConfirming ? <Loader2 className='size-5 animate-spin' /> : <CheckCircle2 className='size-5' />}
        {hasBankDetails ? 'Tôi đã chuyển khoản' : 'Ghi nhận thanh toán tiền mặt'}
      </Button>
      <p className='text-xs text-muted-foreground'>Công nợ chỉ thay đổi sau khi người nhận xác nhận đã nhận tiền.</p>
    </Card>
  )
}
