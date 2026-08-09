'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Home, Sparkles } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PATHS } from '@/constants'

export default function AboutPage() {
  const highlights = [
    {
      title: 'Xóa Tan Ngại Ngùng Khi Chia Tiền',
      description:
        'Tự động tính toán chính xác số tiền từng thành viên cần trả/nhận mà không cần phải nhắc nhở trực tiếp.'
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
    <div className='flex min-h-screen flex-col bg-background font-sans text-foreground'>
      <Navbar />

      <main className='mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-8 sm:py-12'>
        {/* Hero Section */}
        <div className='mx-auto max-w-2xl space-y-4 text-center'>
          <Badge variant='default' className='gap-1 px-3 py-1'>
            <Sparkles className='size-3.5 text-amber-500' /> Về ứng dụng BillMates
          </Badge>
          <h1 className='text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>
            Giải Pháp Chia Tiền Nhóm Thông Minh & Công Bằng
          </h1>
          <p className='text-sm text-muted-foreground sm:text-base'>
            BillMates được thiết kế với tiêu chí **Mobile-First**, giúp các bạn cùng phòng, nhóm bạn đi du lịch hoặc
            đồng nghiệp quản lý chi tiêu và công nợ một cách minh bạch, tiện lợi nhất.
          </p>
          <div className='flex justify-center gap-3 pt-2'>
            <Button size='lg' className='gap-2 rounded-2xl font-semibold shadow-md shadow-primary/20' asChild>
              <Link href={PATHS.ROOMS}>
                <Home className='size-5' /> Trải nghiệm ngay <ArrowRight className='size-4' />
              </Link>
            </Button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className='grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2'>
          {highlights.map((item, idx) => (
            <Card
              key={idx}
              className='space-y-2 rounded-3xl border-primary/20 bg-card p-5 transition-all hover:border-primary/40'
            >
              <div className='flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                <CheckCircle2 className='size-5' />
              </div>
              <h3 className='text-base font-bold text-foreground'>{item.title}</h3>
              <p className='text-xs leading-relaxed text-muted-foreground'>{item.description}</p>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
