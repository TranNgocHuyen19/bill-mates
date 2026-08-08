'use client'

import * as React from 'react'
import { QrCode, Copy, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { showSuccessToast } from '@/lib/toast'

export interface VietQRCardProps {
  bankName: string
  accountNumber: string
  accountName: string
  amount: string
  content: string
  onConfirm: () => void
  isConfirming?: boolean
}

export function VietQRCard({
  bankName,
  accountNumber,
  accountName,
  amount,
  content,
  onConfirm,
  isConfirming = false
}: VietQRCardProps) {
  const handleCopy = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      showSuccessToast(`Đã sao chép ${label}!`)
    }
  }

  return (
    <Card className="p-6 border-primary/20 space-y-6 bg-card text-center shadow-md rounded-3xl">
      {/* VietQR Container */}
      <div className="bg-white p-4 rounded-2xl inline-block shadow-xs border border-border">
        <div className="size-56 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-4">
          <QrCode className="size-32 text-primary" />
          <span className="text-[11px] font-bold text-slate-700 mt-2">VietQR • {bankName}</span>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-xs text-muted-foreground uppercase tracking-wider block">Số tiền cần chuyển</span>
        <span className="text-3xl font-bold text-primary">{amount}</span>
      </div>

      {/* Bank Details */}
      <div className="space-y-2.5 bg-muted/40 p-4 rounded-2xl text-left text-xs">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Ngân hàng</span>
          <span className="font-bold text-foreground">{bankName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Số tài khoản</span>
          <span className="font-mono font-bold text-foreground flex items-center gap-1">
            {accountNumber}
            <Copy className="size-3 cursor-pointer text-primary" onClick={() => handleCopy(accountNumber, 'STK')} />
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Chủ tài khoản</span>
          <span className="font-bold text-foreground uppercase">{accountName}</span>
        </div>
        <div className="flex justify-between items-center border-t border-border pt-2">
          <span className="text-muted-foreground">Nội dung chuyển</span>
          <span className="font-mono font-bold text-primary flex items-center gap-1">
            {content}
            <Copy className="size-3 cursor-pointer text-primary" onClick={() => handleCopy(content, 'nội dung')} />
          </span>
        </div>
      </div>

      <Button onClick={onConfirm} disabled={isConfirming} className="w-full h-12 text-sm font-semibold gap-2 shadow-md shadow-primary/20 rounded-2xl">
        <CheckCircle2 className="size-5" />
        {isConfirming ? 'Đang xác nhận...' : 'Tôi đã chuyển khoản thành công'}
      </Button>
    </Card>
  )
}
