'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, QrCode, Copy, ShieldCheck, CreditCard } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { showSuccessToast } from '@/lib/toast'
import { PATHS } from '@/constants'

export default function SettleDebtPage() {
  const router = useRouter()
  const [isConfirming, setIsConfirming] = React.useState(false)

  const bankInfo = {
    bankName: 'MBBank (Ngân hàng Quân Đội)',
    accountNumber: '0988123456',
    accountName: 'TRAN NGOC HUYEN',
    amount: '150.000 ₫',
    content: 'BILLMATES PHONG101 THANHTOAN'
  }

  const handleConfirmSettle = () => {
    setIsConfirming(true)
    setTimeout(() => {
      showSuccessToast('Đã gửi thông báo xác nhận thanh toán!')
      router.push(PATHS.DEBTS.INDEX)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-6 md:py-8 space-y-6">
        <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
          <Link href={PATHS.DEBTS.INDEX}>
            <ArrowLeft className="size-4" /> Quay lại Công nợ
          </Link>
        </Button>

        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Thanh Toán Công Nợ</h1>
          <p className="text-xs text-muted-foreground">Quét mã VietQR bên dưới bằng app ngân hàng để chuyển khoản chính xác.</p>
        </div>

        {/* VietQR Mock Card */}
        <Card className="p-6 border-primary/20 space-y-6 bg-card text-center shadow-md">
          {/* VietQR Image Container */}
          <div className="bg-white p-4 rounded-2xl inline-block shadow-sm border border-border">
            <div className="size-56 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-4">
              <QrCode className="size-32 text-primary" />
              <span className="text-[11px] font-bold text-slate-700 mt-2">VietQR • MBBank</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider block">Số tiền cần chuyển</span>
            <span className="text-3xl font-bold text-primary">{bankInfo.amount}</span>
          </div>

          {/* Bank Transfer Details */}
          <div className="space-y-2.5 bg-muted/40 p-4 rounded-xl text-left text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Ngân hàng</span>
              <span className="font-bold text-foreground">{bankInfo.bankName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Số tài khoản</span>
              <span className="font-mono font-bold text-foreground flex items-center gap-1">
                {bankInfo.accountNumber}
                <Copy className="size-3 cursor-pointer text-primary" onClick={() => alert('Đã sao chép STK!')} />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Chủ tài khoản</span>
              <span className="font-bold text-foreground uppercase">{bankInfo.accountName}</span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-2">
              <span className="text-muted-foreground">Nội dung chuyển</span>
              <span className="font-mono font-bold text-primary flex items-center gap-1">
                {bankInfo.content}
                <Copy className="size-3 cursor-pointer text-primary" onClick={() => alert('Đã sao chép nội dung!')} />
              </span>
            </div>
          </div>

          <Button onClick={handleConfirmSettle} disabled={isConfirming} className="w-full h-12 text-sm font-semibold gap-2 shadow-md shadow-primary/20">
            <CheckCircle2 className="size-5" />
            {isConfirming ? 'Đang xác nhận...' : 'Tôi đã chuyển khoản thành công'}
          </Button>
        </Card>
      </main>
    </div>
  )
}
