'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Receipt, Users, Calendar, Wallet } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { showSuccessToast } from '@/lib/toast'
import { PATHS } from '@/constants'

export default function NewExpenseStep3ConfirmPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSave = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      showSuccessToast('Đã thêm khoản chi thành công!')
      router.push(PATHS.ROOM_DETAIL('101'))
    }, 800)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Wizard Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
            <Link href={PATHS.EXPENSES.SPLIT}>
              <ArrowLeft className="size-4" /> Bước 2
            </Link>
          </Button>
          <div className="text-xs font-semibold text-muted-foreground">
            Bước <span className="text-primary font-bold">3</span> / 3
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Xác Nhận Hóa Đơn</h1>
          <p className="text-xs text-muted-foreground">Vui lòng kiểm tra lại thông tin chia tiền trước khi hoàn tất.</p>
        </div>

        {/* Invoice Summary Card */}
        <Card className="p-6 border-primary/20 space-y-5 bg-card shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider block">Tên hóa đơn</span>
              <h2 className="text-xl font-bold text-foreground">Tiền Điện Tháng 8/2026</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground uppercase tracking-wider block">Tổng tiền</span>
              <span className="text-2xl font-bold text-primary">1.280.000 ₫</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-muted-foreground">Người thanh toán trước</span>
              <span className="font-bold text-foreground block">Huyên (Bạn)</span>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Phương thức chia</span>
              <span className="font-bold text-foreground block">Chia đều 4 phần</span>
            </div>
          </div>

          {/* Breakdown Per Member */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Chi tiết chia tiền từng người</h4>

            <div className="space-y-2 bg-muted/40 p-3 rounded-xl">
              <div className="flex items-center justify-between text-xs py-1">
                <span>Tuấn Anh nợ Huyên</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">320.000 ₫</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span>Bảo Nam nợ Huyên</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">320.000 ₫</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span>Minh Hoàng nợ Huyên</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">320.000 ₫</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-t border-border pt-2">
                <span>Huyên (Đã trả toàn bộ)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">+ 960.000 ₫</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="pt-2 flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href={PATHS.EXPENSES.SPLIT}>Sửa lại</Link>
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting} className="gap-2 font-semibold h-11 px-8">
            <CheckCircle2 className="size-4" /> {isSubmitting ? 'Đang lưu...' : 'Hoàn tất & Lưu hóa đơn'}
          </Button>
        </div>
      </main>
    </div>
  )
}
