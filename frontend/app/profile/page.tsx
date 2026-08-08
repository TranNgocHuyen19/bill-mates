'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  User,
  CreditCard,
  Bell,
  Moon,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Lock
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLogoutMutation } from '@/features/auth/queries'
import { useTheme } from 'next-themes'
import { PATHS } from '@/constants'

export default function ProfilePage() {
  const logoutMutation = useLogoutMutation()
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 md:py-8 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <User className="size-6 text-primary" /> Tài Khoản & Cài Đặt
        </h1>

        {/* Profile Card Header */}
        <Card className="p-5 flex items-center gap-4 border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="size-16 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center shadow-md">
            H
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-foreground">Trần Ngọc Huyên</h2>
              <Badge variant="default" className="text-[10px]">Tài khoản xác thực</Badge>
            </div>
            <p className="text-xs text-muted-foreground">trann@example.com • 0988 123 456</p>
          </div>
        </Card>

        {/* Account Settings Menu */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cấu hình thanh toán</h3>

          <Card className="divide-y divide-border">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => alert('Cấu hình STK ngân hàng')}>
              <div className="flex items-center gap-3">
                <CreditCard className="size-5 text-primary" />
                <div>
                  <span className="font-semibold text-sm text-foreground block">Tài khoản ngân hàng nhận tiền</span>
                  <span className="text-xs text-muted-foreground">MBBank • 0988123456 (Trần Ngọc Huyên)</span>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </Card>

          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pt-2">Cài đặt ứng dụng</h3>

          <Card className="divide-y divide-border">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <div className="flex items-center gap-3">
                <Moon className="size-5 text-primary" />
                <div>
                  <span className="font-semibold text-sm text-foreground block">Giao diện Sáng / Tối</span>
                  <span className="text-xs text-muted-foreground">Hiện tại: {theme === 'dark' ? 'Chế độ Tối (Dark)' : 'Chế độ Sáng (Light)'}</span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">Đổi</Badge>
            </div>

            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => alert('Cài đặt thông báo')}>
              <div className="flex items-center gap-3">
                <Bell className="size-5 text-primary" />
                <div>
                  <span className="font-semibold text-sm text-foreground block">Thông báo biến động & đòi nợ</span>
                  <span className="text-xs text-muted-foreground">Đang bật thông báo đẩy</span>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>

            <Link href={PATHS.AUTH.FORGOT_PASSWORD} className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Lock className="size-5 text-primary" />
                <div>
                  <span className="font-semibold text-sm text-foreground block">Đổi mật khẩu tài khoản</span>
                  <span className="text-xs text-muted-foreground">Gửi liên kết đổi mật khẩu tới email</span>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>

            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => alert('Phiên bản v1.0.0')}>
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-5 text-primary" />
                <div>
                  <span className="font-semibold text-sm text-foreground block">Bảo mật & Quyền riêng tư</span>
                  <span className="text-xs text-muted-foreground">Bảo vệ thông tin chi tiêu bằng PIN/Biometrics</span>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Logout Button */}
        <div className="pt-2">
          <Button
            variant="destructive"
            className="w-full h-12 text-sm font-semibold gap-2"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="size-4" /> Đăng xuất khỏi thiết bị
          </Button>
        </div>
      </main>
    </div>
  )
}
