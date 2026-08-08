'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { showSuccessToast } from '@/lib/toast'
import { PATHS } from '@/constants'

export default function NewExpenseStep3ConfirmPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const [title, setTitle] = useState<string>('Hóa đơn mới')
  const [amountNum, setAmountNum] = useState<number>(0)
  const [splitType, setSplitType] = useState<string>('equal')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTitle = sessionStorage.getItem('draft_expense_title')
      const savedAmount = sessionStorage.getItem('draft_expense_amount')
      const savedType = sessionStorage.getItem('draft_expense_split_type')

      if (savedTitle) {
        setTitle(savedTitle)
      }
      if (savedAmount) {
        setAmountNum(parseInt(savedAmount, 10) || 0)
      }
      if (savedType) {
        setSplitType(savedType)
      }
    }
  }, [])

  const handleSave = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      showSuccessToast('Đã thêm và lưu khoản chi thành công!')
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('draft_expense_title')
        sessionStorage.removeItem('draft_expense_amount')
        sessionStorage.removeItem('draft_expense_split_type')
      }
      router.push(PATHS.ROOMS)
    }, 600)
  }

  const splitLabel = splitType === 'equal' ? 'Chia đều' : splitType === 'itemized' ? 'Theo món' : 'Theo tỷ lệ %'

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 sm:py-8 space-y-5 sm:space-y-6">
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
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Xác Nhận Hóa Đơn</h1>
          <p className="text-xs text-muted-foreground">Vui lòng kiểm tra lại thông tin chia tiền trước khi hoàn tất.</p>
        </div>

        {/* Invoice Summary Card */}
        <Card className="p-5 sm:p-6 border-primary/20 space-y-5 bg-card shadow-xs rounded-3xl">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider block">Tên hóa đơn</span>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">{title}</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground uppercase tracking-wider block">Tổng tiền</span>
              <span className="text-xl sm:text-2xl font-bold text-primary">{amountNum.toLocaleString()} ₫</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-0.5">
              <span className="text-muted-foreground">Người thanh toán</span>
              <span className="font-bold text-foreground block">Bạn</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground">Phương thức chia</span>
              <span className="font-bold text-foreground block">{splitLabel}</span>
            </div>
          </div>
        </Card>

        <div className="pt-2 flex justify-end gap-3">
          <Button variant="outline" className="rounded-xl" asChild>
            <Link href={PATHS.EXPENSES.SPLIT}>Sửa lại</Link>
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting} className="gap-2 font-semibold h-11 px-8 rounded-2xl shadow-md">
            <CheckCircle2 className="size-4" /> {isSubmitting ? 'Đang lưu...' : 'Hoàn tất & Lưu hóa đơn'}
          </Button>
        </div>
      </main>
    </div>
  )
}
