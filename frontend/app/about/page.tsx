'use client'

import * as React from 'react'
import Link from 'next/link'
import { Wallet, Sparkles, CheckCircle2, Shield, ArrowRight, Home } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PATHS } from '@/constants'

export default function AboutPage() {
  const highlights = [
    {
      title: 'Xóa Tan Ngại Ngùng Khi Chia Tiền',
      description: 'Tự động tính toán chính xác số tiền từng thành viên cần trả/nhận mà không cần phải nhắc nhở trực tiếp.'
    },
    {
      title: 'Quét Ảnh Hóa Đơn Bằng AI OCR',
      description: 'Tải lên ảnh bill siêu thị, điện nước, ăn uống để AI tự động trích xuất món ăn và giá tiền.'
    },
    {
      title: 'Thuật Toán Tối Ưu Hóa Công Nợ',
      description: 'Tự động rút gọn các giao dịch nợ lặp đi lặp lại giữa các thành viên thành 1 giao dịch duy nhất.'
    },
    {
      title: 'Thanh Toán Nhanh Qua VietQR',
      description: 'Tự động tạo mã QR chứa số tài khoản, số tiền và nội dung chuyển khoản chính xác 100%.'
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <Badge variant="default" className="gap-1 px-3 py-1">
            <Sparkles className="size-3.5 text-amber-500" /> Về ứng dụng BillMates
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Giải Pháp Chia Tiền Nhóm Thông Minh & Công Bằng
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            BillMates được thiết kế với tiêu chí **Mobile-First**, giúp các bạn cùng phòng, nhóm bạn đi du lịch hoặc đồng nghiệp quản lý chi tiêu và công nợ một cách minh bạch, tiện lợi nhất.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button size="lg" className="gap-2 font-semibold rounded-2xl shadow-md shadow-primary/20" asChild>
              <Link href={PATHS.ROOMS}>
                <Home className="size-5" /> Trải nghiệm ngay <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          {highlights.map((item, idx) => (
            <Card key={idx} className="p-5 border-primary/20 bg-card hover:border-primary/40 transition-all rounded-3xl space-y-2">
              <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <CheckCircle2 className="size-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
