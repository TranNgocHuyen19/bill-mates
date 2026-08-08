'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  QrCode,
  CheckCircle2
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { showSuccessToast } from '@/lib/toast'
import { PATHS } from '@/constants'

export default function DebtsPage() {
  const [debtsToReceive, setDebtsToReceive] = React.useState<Array<{ id: string; name: string; amount: string; reason: string }>>([])
  const [debtsToPay, setDebtsToPay] = React.useState<Array<{ id: string; name: string; amount: string; reason: string }>>([])

  const totalDebtsCount = debtsToReceive.length + debtsToPay.length

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 sm:py-8 space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CreditCard className="size-6 sm:size-7 text-primary" /> Quản Lý Công Nợ
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Theo dõi chi tiết số tiền bạn cần thu và số tiền cần trả cho các thành viên.
            </p>
          </div>

          <Button className="gap-2 shadow-md shadow-primary/20 rounded-xl h-10 text-xs font-semibold" asChild>
            <Link href={PATHS.DEBTS.SETTLE}>
              <QrCode className="size-4" /> Thanh toán qua QR
            </Link>
          </Button>
        </div>

        {/* AI Debt Minimization Suggestion Card */}
        {totalDebtsCount > 0 ? (
          <Card className="p-4 sm:p-5 border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent space-y-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="gap-1 text-xs">
                <Sparkles className="size-3 text-amber-300" /> AI Optimization
              </Badge>
              <span className="text-xs font-semibold text-primary">Tối ưu hóa dòng tiền (Cash Flow)</span>
            </div>

            <p className="text-xs text-muted-foreground">
              Thuật toán giúp rút ngắn các giao dịch lặp đi lặp lại thành số giao dịch tối thiểu nhất.
            </p>
          </Card>
        ) : (
          <Card className="p-8 text-center flex flex-col items-center justify-center space-y-3 border-emerald-500/20 bg-emerald-500/5 rounded-3xl">
            <div className="size-14 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="size-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground">Bạn không có khoản nợ nào!</h3>
              <p className="text-xs text-muted-foreground">
                Tất cả các hóa đơn chi tiêu nhóm của bạn đều đã được thanh toán sòng phẳng.
              </p>
            </div>
          </Card>
        )}

        {/* Debt Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Receive Section */}
          <div className="space-y-3">
            <h2 className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <ArrowDownLeft className="size-5" /> Tiền Bạn Cần Thu ({debtsToReceive.length})
            </h2>

            {debtsToReceive.length === 0 ? (
              <Card className="p-4 text-center text-xs text-muted-foreground rounded-2xl border-dashed">
                Chưa có ai nợ bạn tiền
              </Card>
            ) : (
              debtsToReceive.map((item) => (
                <Card key={item.id} className="p-4 flex items-center justify-between border-emerald-500/20 bg-emerald-500/5 rounded-2xl">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                    <span className="text-xs text-muted-foreground">{item.reason}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 block">{item.amount}</span>
                    <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 text-primary" onClick={() => showSuccessToast(`Đã gửi nhắc nhở tới ${item.name}!`)}>
                      Nhắc nợ
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Pay Section */}
          <div className="space-y-3">
            <h2 className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <ArrowUpRight className="size-5" /> Tiền Bạn Cần Trả ({debtsToPay.length})
            </h2>

            {debtsToPay.length === 0 ? (
              <Card className="p-4 text-center text-xs text-muted-foreground rounded-2xl border-dashed">
                Bạn không nợ ai tiền
              </Card>
            ) : (
              debtsToPay.map((item) => (
                <Card key={item.id} className="p-4 flex items-center justify-between border-rose-500/20 bg-rose-500/5 rounded-2xl">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                    <span className="text-xs text-muted-foreground">{item.reason}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-rose-600 dark:text-rose-400 block">{item.amount}</span>
                    <Button size="sm" className="h-7 text-xs gap-1 mt-1 rounded-xl" asChild>
                      <Link href={PATHS.DEBTS.SETTLE}>
                        Trả ngay
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
