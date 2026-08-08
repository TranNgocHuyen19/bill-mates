'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Receipt, ArrowRight, Sparkles } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { PATHS } from '@/constants'

export default function NewExpenseStep1Page() {
  const router = useRouter()
  const [title, setTitle] = React.useState('Tiền Điện Tháng 8')
  const [amount, setAmount] = React.useState('1280000')

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(PATHS.EXPENSES.SPLIT)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Step Wizard Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
            <Link href={PATHS.ROOM_DETAIL('101')}>
              <ArrowLeft className="size-4" /> Quay lại
            </Link>
          </Button>
          <div className="text-xs font-semibold text-muted-foreground">
            Bước <span className="text-primary font-bold">1</span> / 3
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Thêm Khoản Chi Mới</h1>
          <p className="text-xs text-muted-foreground">Nhập thông tin cơ bản hoặc tải ảnh hóa đơn để AI tự đọc số tiền.</p>
        </div>

        {/* AI OCR Upload Card */}
        <Card className="p-4 border-dashed border-2 border-primary/30 bg-primary/5 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:border-primary transition-colors" onClick={() => alert('Tính năng AI OCR đang quét ảnh hóa đơn...')}>
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Camera className="size-6" />
          </div>
          <div>
            <span className="font-bold text-sm text-foreground flex items-center justify-center gap-1">
              Quét hóa đơn bằng AI <Sparkles className="size-3.5 text-amber-500" />
            </span>
            <span className="text-xs text-muted-foreground block mt-0.5">Tải lên ảnh bill (WinMart, Điện, Nước...) để tự động điền</span>
          </div>
        </Card>

        {/* Form */}
        <form onSubmit={handleNext} className="space-y-5">
          <Input
            label="Tên khoản chi / Hóa đơn"
            placeholder="VD: Tiền điện, Tiền chợ, Tiền trà sữa"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            icon={<Receipt className="size-4" />}
            required
          />

          <Input
            label="Tổng số tiền (VNĐ)"
            type="number"
            placeholder="0 ₫"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div className="pt-4 flex justify-end">
            <Button type="submit" className="w-full sm:w-auto px-8 gap-2 font-semibold h-11">
              Tiếp theo: Chia tiền <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
