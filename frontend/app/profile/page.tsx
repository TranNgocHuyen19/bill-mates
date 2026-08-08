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
  Lock
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLogoutMutation } from '@/features/auth/queries'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import { PATHS } from '@/constants'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function ProfilePage() {
  const logoutMutation = useLogoutMutation()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = React.useState<SupabaseUser | null>(null)

  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
    })
  }, [])

  const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Thành viên'
  const userEmail = user?.email || 'Chưa cập nhật email'

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 pb-24 sm:py-8 space-y-5 sm:space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <User className="size-6 text-primary" /> Tài Khoản & Cài Đặt
        </h1>

        {/* Profile Card Header */}
        <Card className="p-5 flex items-center gap-4 border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl shadow-xs">
          <div className="size-14 sm:size-16 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center shadow-md shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-0.5 overflow-hidden">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base sm:text-lg text-foreground truncate">{userName}</h2>
              <Badge variant="default" className="text-[10px] shrink-0">Đã xác thực</Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </Card>

        {/* Account Settings Menu */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cấu hình thanh toán</h3>

          <Card className="divide-y divide-border rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => alert('Cấu hình STK ngân hàng nhận tiền')}>
              <div className="flex items-center gap-3">
                <CreditCard className="size-5 text-primary shrink-0" />
                <div>
                  <span className="font-semibold text-sm text-foreground block">Tài khoản ngân hàng nhận tiền</span>
                  <span className="text-xs text-muted-foreground">Chưa cấu hình tài khoản (Bấm để thêm)</span>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </Card>

          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pt-2">Cài đặt ứng dụng</h3>

          <Card className="divide-y divide-border rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <div className="flex items-center gap-3">
                <Moon className="size-5 text-primary shrink-0" />
                <div>
                  <span className="font-semibold text-sm text-foreground block">Giao diện Sáng / Tối</span>
                  <span className="text-xs text-muted-foreground">Hiện tại: {theme === 'dark' ? 'Chế độ Tối (Dark)' : 'Chế độ Sáng (Light)'}</span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">Đổi</Badge>
            </div>

            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => alert('Cài đặt thông báo')}>
              <div className="flex items-center gap-3">
                <Bell className="size-5 text-primary shrink-0" />
                <div>
                  <span className="font-semibold text-sm text-foreground block">Thông báo biến động & đòi nợ</span>
                  <span className="text-xs text-muted-foreground">Đang bật thông báo</span>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>

            <Link href={PATHS.AUTH.FORGOT_PASSWORD} className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Lock className="size-5 text-primary shrink-0" />
                <div>
                  <span className="font-semibold text-sm text-foreground block">Đổi mật khẩu tài khoản</span>
                  <span className="text-xs text-muted-foreground">Gửi liên kết đổi mật khẩu tới email</span>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>

            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => alert('Phiên bản v1.0.0')}>
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-5 text-primary shrink-0" />
                <div>
                  <span className="font-semibold text-sm text-foreground block">Bảo mật & Quyền riêng tư</span>
                  <span className="text-xs text-muted-foreground">Bảo vệ thông tin chi tiêu bằng mã hóa</span>
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
            className="w-full h-12 text-sm font-semibold gap-2 rounded-2xl"
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
