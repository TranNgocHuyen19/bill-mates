'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Plus,
  Users,
  Receipt,
  CreditCard,
  ArrowDownLeft,
  ChevronRight,
  Sparkles,
  Share2,
  FolderPlus,
  UserPlus
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { showSuccessToast } from '@/lib/toast'
import { PATHS } from '@/constants'

export default function RoomDetailPage() {
  const params = useParams()
  const roomId = params?.id || '101'

  // Dynamic state without mock data
  const [members, setMembers] = React.useState<Array<{ name: string; role: string; balance: string; isPositive: boolean }>>([
    { name: 'Bạn (Trưởng phòng)', role: 'Trưởng phòng', balance: '0 ₫', isPositive: true }
  ])

  const [expenses, setExpenses] = React.useState<Array<{
    id: string
    title: string
    payer: string
    amount: string
    date: string
    splitMethod: string
    icon: string
  }>>([])

  const totalExpensesAmount = expenses.reduce((acc, curr) => acc + parseInt(curr.amount.replace(/\D/g, '') || '0'), 0)

  const handleShareInvite = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/rooms/join/${roomId}`)
      showSuccessToast('Đã sao chép liên kết mời tham gia phòng!')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-4 sm:py-8 space-y-5 sm:space-y-6">
        {/* Top Room Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 sm:p-6 rounded-3xl border border-primary/20 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">Mã phòng #{roomId}</Badge>
              <span className="text-xs text-muted-foreground">{members.length} Thành viên</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
              Phòng Trọ #{roomId}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Quản lý hóa đơn chi tiêu & tính toán chia tiền nhóm tự động.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl h-10 text-xs" onClick={handleShareInvite}>
              <Share2 className="size-4" /> Mời bạn
            </Button>
            <Button size="sm" className="gap-1.5 shadow-md shadow-primary/20 rounded-xl h-10 text-xs font-semibold" asChild>
              <Link href={PATHS.EXPENSES.NEW}>
                <Plus className="size-4" /> Thêm khoản chi
              </Link>
            </Button>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-5 border-emerald-500/30 bg-emerald-500/5 space-y-2 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Số tiền bạn nhận</span>
              <div className="size-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ArrowDownLeft className="size-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">0 ₫</div>
            <p className="text-[11px] text-muted-foreground">Chưa có khoản nợ phát sinh</p>
          </Card>

          <Card className="p-4 sm:p-5 border-border bg-card space-y-2 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Tổng chi tiêu nhóm</span>
              <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                <Receipt className="size-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {totalExpensesAmount > 0 ? `${totalExpensesAmount.toLocaleString()} ₫` : '0 ₫'}
            </div>
            <p className="text-[11px] text-muted-foreground">{expenses.length} Hóa đơn đã tạo</p>
          </Card>

          <Card className="p-4 sm:p-5 border-amber-500/30 bg-amber-500/5 space-y-2 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Tối ưu hóa dòng tiền</span>
              <div className="size-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sparkles className="size-4" />
              </div>
            </div>
            <div className="text-sm font-bold text-foreground">0 Giao dịch cần xử lý</div>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary font-semibold" asChild>
              <Link href={PATHS.DEBTS.INDEX}>
                Chi tiết công nợ <ChevronRight className="size-3" />
              </Link>
            </Button>
          </Card>
        </div>

        {/* Two Columns: Recent Expenses & Room Members */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Left Column: Recent Expenses */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <Receipt className="size-5 text-primary" /> Hóa đơn gần đây
              </h2>
              <Button variant="ghost" size="sm" className="text-xs" asChild>
                <Link href={PATHS.EXPENSES.NEW}>+ Tạo mới</Link>
              </Button>
            </div>

            {expenses.length === 0 ? (
              <Card className="p-6 text-center flex flex-col items-center justify-center space-y-3 border-dashed border-2 border-primary/20 bg-primary/5 rounded-2xl">
                <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <FolderPlus className="size-6" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-sm text-foreground">Chưa có hóa đơn nào</h3>
                  <p className="text-xs text-muted-foreground">Tạo khoản chi đầu tiên để phân chia tiền nhà, điện nước hoặc ăn uống.</p>
                </div>
                <Button size="sm" className="gap-1.5 font-semibold rounded-xl" asChild>
                  <Link href={PATHS.EXPENSES.NEW}>
                    <Plus className="size-4" /> Thêm khoản chi mới
                  </Link>
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {expenses.map((exp) => (
                  <Card key={exp.id} className="p-4 flex items-center justify-between gap-4 hover:border-primary/40 transition-colors rounded-2xl">
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
            )}
          </div>

          {/* Right Column: Room Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="size-5 text-primary" /> Thành viên ({members.length})
              </h2>
            </div>

            <Card className="p-4 space-y-3 rounded-2xl">
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

              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 mt-2 rounded-xl h-10" onClick={handleShareInvite}>
                <UserPlus className="size-4 text-primary" /> Mời bạn cùng phòng
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
