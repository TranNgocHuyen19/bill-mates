'use client'

import * as React from 'react'
import { Wallet, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      {/* Left Panel: Branding & Visuals (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary text-primary-foreground p-12 flex-col justify-between overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary via-[#1e2e85] to-[#3f51b5] z-0" />
        <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-secondary/15 blur-3xl z-0" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white/5 blur-2xl z-0" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="size-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center">
            <Wallet className="size-6 text-white" />
          </div>
          <span className="font-sans font-bold text-2xl tracking-tight">BillMates</span>
        </div>

        {/* Brand Hero Copy */}
        <div className="relative z-10 my-auto max-w-md">
          <h1 className="text-4xl font-bold font-sans tracking-tight mb-4 leading-tight">
            Chia tiền thông minh,<br />giữ gìn hòa khí.
          </h1>
          <p className="text-white/80 font-sans font-light leading-relaxed mb-8">
            Giải quyết triệt để sự ngại ngùng khi chia tiền phòng, tiền ăn uống cùng bạn bè hay bạn cùng phòng. Minh bạch, nhanh chóng và tự động.
          </p>

          {/* Features list */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-6 text-[#6cf8bb] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Chia hóa đơn tức thì</h4>
                <p className="text-xs text-white/70">Nhập hóa đơn, chọn thành viên và chia đều hoặc chia theo món chỉ trong 3 bước.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-6 text-[#6cf8bb] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Theo dõi công nợ minh bạch</h4>
                <p className="text-xs text-white/70">Số liệu được cập nhật thời gian thực, hiển thị rõ ràng ai nợ ai bao nhiêu tiền.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-6 text-[#6cf8bb] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Đồng bộ hóa đơn giản</h4>
                <p className="text-xs text-white/70">Hỗ trợ quét hóa đơn tự động và nhắc thanh toán tinh tế thông qua các thông báo.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-white/60">
          <span>© 2026 BillMates. All rights reserved.</span>
          <div className="flex items-center gap-1">
            <ShieldCheck className="size-4" />
            <span>Kết nối bảo mật mã hóa</span>
          </div>
        </div>
      </div>

      {/* Right Panel: Content Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 z-10">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Brand Header */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="size-9 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
              <Wallet className="size-5 text-primary" />
            </div>
            <span className="font-sans font-bold text-xl tracking-tight text-primary">BillMates</span>
          </div>

          {/* Form Content inside Card */}
          <div className="bg-card border border-border rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
