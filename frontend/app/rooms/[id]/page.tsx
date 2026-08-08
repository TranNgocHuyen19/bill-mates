'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Plus,
  Users,
  Receipt,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  ChevronRight,
  Sparkles,
  Share2
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PATHS } from '@/constants'

export default function RoomDetailPage() {
  const params = useParams()
  const roomId = params?.id || '101'

  const members = [
    { name: 'Huyên (Bạn)', role: 'Trưởng phòng', balance: '+ 320.000 ₫', isPositive: true },
    { name: 'Tuấn Anh', role: 'Thành viên', balance: '- 180.000 ₫', isPositive: false },
    { name: 'Bảo Nam', role: 'Thành viên', balance: '- 140.000 ₫', isPositive: false },
    { name: 'Minh Hoàng', role: 'Thành viên', balance: '0 ₫', isPositive: true }
  ]

  const recentExpenses = [
    {
      id: 'exp-1',
      title: 'Tiền Điện Tháng 8/2026',
      payer: 'Huyên',
      amount: '1.280.000 ₫',
      date: 'Hôm qua, 14:30',
      splitMethod: 'Chia đều (4 người)',
      icon: '⚡'
    },
    {
      id: 'exp-2',
      title: 'Tiền Nước + Vệ Sinh',
      payer: 'Tuấn Anh',
      amount: '340.000 ₫',
      date: '05/08/2026',
      splitMethod: 'Chia đều (4 người)',
      icon: '💧'
    },
    {
      id: 'exp-3',
      title: 'Đi Chợ Siêu Thị WinMart',
      payer: 'Huyên',
      amount: '650.000 ₫',
      date: '02/08/2026',
      splitMethod: 'Chia theo món',
      icon: '🛒'
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Top Room Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">Mã phòng #{roomId}</Badge>
              <span className="text-xs text-muted-foreground">4 Thành viên</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Phòng Trọ 101 - Căn Hộ Homies
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Địa chỉ: 123 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => alert('Đã sao chép link mời vào phòng!')}>
              <Share2 className="size-4" /> Mời bạn
            </Button>
            <Button size="sm" className="gap-1.5 shadow-md shadow-primary/20" asChild>
              <Link href={PATHS.EXPENSES.NEW}>
                <Plus className="size-4" /> Thêm khoản chi
              </Link>
            </Button>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 border-emerald-500/30 bg-emerald-500/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Số tiền bạn được nhận</span>
              <div className="size-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ArrowDownLeft className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+ 320.000 ₫</div>
            <p className="text-[11px] text-muted-foreground">Từ 2 thành viên trong phòng</p>
          </Card>

          <Card className="p-5 border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Tổng chi tiêu tháng này</span>
              <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                <Receipt className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">2.270.000 ₫</div>
            <p className="text-[11px] text-muted-foreground">Tăng 12% so với tháng trước</p>
          </Card>

          <Card className="p-5 border-amber-500/30 bg-amber-500/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Gợi ý tối ưu nợ</span>
              <div className="size-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sparkles className="size-4" />
              </div>
            </div>
            <div className="text-sm font-bold text-foreground">Chỉ cần 2 giao dịch</div>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary font-semibold" asChild>
              <Link href={PATHS.DEBTS.INDEX}>
                Xem gợi ý thanh toán <ChevronRight className="size-3" />
              </Link>
            </Button>
          </Card>
        </div>

        {/* Two Columns: Recent Expenses & Room Members */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Recent Expenses (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Receipt className="size-5 text-primary" /> Hóa đơn chi tiêu gần đây
              </h2>
              <Button variant="ghost" size="sm" className="text-xs" asChild>
                <Link href={PATHS.EXPENSES.NEW}>+ Tạo mới</Link>
              </Button>
            </div>

            <div className="space-y-3">
              {recentExpenses.map((exp) => (
                <Card key={exp.id} className="p-4 flex items-center justify-between gap-4 hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="size-11 rounded-2xl bg-muted flex items-center justify-center text-xl shrink-0">
                      {exp.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{exp.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>Người chi: <strong>{exp.payer}</strong></span>
                        <span>•</span>
                        <span>{exp.splitMethod}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-foreground block">{exp.amount}</span>
                    <span className="text-[11px] text-muted-foreground">{exp.date}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Column: Room Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="size-5 text-primary" /> Thành viên ({members.length})
              </h2>
            </div>

            <Card className="p-4 space-y-3">
              {members.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <span className="font-semibold text-sm text-foreground block">{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.role}</span>
                  </div>

                  <span className={`text-xs font-bold ${m.balance === '0 ₫' ? 'text-muted-foreground' : m.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {m.balance}
                  </span>
                </div>
              ))}

              <Button variant="outline" size="sm" className="w-full text-xs gap-1 mt-2" asChild>
                <Link href={PATHS.DEBTS.INDEX}>
                  <CreditCard className="size-3.5" /> Chi tiết công nợ phòng
                </Link>
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
