'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  QrCode,
  CheckCircle,
  HelpCircle
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PATHS } from '@/constants'

export default function DebtsPage() {
  const debtsToReceive = [
    { name: 'Tuấn Anh', amount: '180.000 ₫', reason: 'Tiền Điện Tháng 8', id: 'd1' },
    { name: 'Bảo Nam', amount: '140.000 ₫', reason: 'Tiền Điện + Tiền Chợ', id: 'd2' }
  ]

  const debtsToPay = [
    { name: 'Minh Hoàng', amount: '150.000 ₫', reason: 'Tiền Nước Tháng 8', id: 'p1' }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CreditCard className="size-7 text-primary" /> Quản Lý Công Nợ
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Theo dõi chi tiết số tiền bạn cần thu và số tiền cần trả cho các thành viên.
            </p>
          </div>

          <Button className="gap-2 shadow-md shadow-primary/20" asChild>
            <Link href={PATHS.DEBTS.SETTLE}>
              <QrCode className="size-4" /> Thanh toán qua QR
            </Link>
          </Button>
        </div>

        {/* AI Debt Minimization Suggestion Card */}
        <Card className="p-5 border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="gap-1">
              <Sparkles className="size-3 text-amber-300" /> AI Optimization
            </Badge>
            <span className="text-xs font-semibold text-primary">Tối ưu hóa dòng tiền (Cash Flow)</span>
          </div>

          <p className="text-xs text-muted-foreground">
            Thay vì chuyển tiền lặp đi lặp lại nhiều lần, thuật toán đề xuất gộp 3 giao dịch nhỏ thành <strong>1 giao dịch duy nhất</strong>:
          </p>

          <div className="bg-card p-3 rounded-xl border border-border text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Tuấn Anh ➡️ chuyển cho Huyên</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">170.000 ₫</span>
          </div>
        </Card>

        {/* Debt Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Receive Section */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <ArrowDownLeft className="size-5" /> Tiền Bạn Cần Thu ({debtsToReceive.length})
            </h2>

            {debtsToReceive.map((item) => (
              <Card key={item.id} className="p-4 flex items-center justify-between border-emerald-500/20 bg-emerald-500/5">
                <div>
                  <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                  <span className="text-xs text-muted-foreground">{item.reason}</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 block">{item.amount}</span>
                  <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 text-primary" onClick={() => alert(`Đã gửi nhắc nhở đòi tiền tới ${item.name}!`)}>
                    Nhắc nợ
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pay Section */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <ArrowUpRight className="size-5" /> Tiền Bạn Cần Trả ({debtsToPay.length})
            </h2>

            {debtsToPay.map((item) => (
              <Card key={item.id} className="p-4 flex items-center justify-between border-rose-500/20 bg-rose-500/5">
                <div>
                  <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                  <span className="text-xs text-muted-foreground">{item.reason}</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-rose-600 dark:text-rose-400 block">{item.amount}</span>
                  <Button size="sm" className="h-7 text-xs gap-1 mt-1" asChild>
                    <Link href={PATHS.DEBTS.SETTLE}>
                      Trả ngay
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
