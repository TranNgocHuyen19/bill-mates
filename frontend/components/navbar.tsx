'use client'

import * as React from 'react'
import Link from 'next/link'
import { Wallet, LogOut, User, Loader2, Home } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useLogoutMutation } from '@/features/auth/queries'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { PATHS } from '@/constants'

export function Navbar() {
  const [user, setUser] = React.useState<SupabaseUser | null>(null)
  const [loading, setLoading] = React.useState(true)
  const logoutMutation = useLogoutMutation()

  React.useEffect(() => {
    const supabase = createClient()

    // Fetch current user session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes (login, logout, session refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Thành viên'

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="size-9 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
            <Wallet className="size-5 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight text-primary">BillMates</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Tính năng</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">Cách hoạt động</a>
          <a href="#faq" className="hover:text-foreground transition-colors">Câu hỏi thường gặp</a>
        </nav>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="size-8 flex items-center justify-center">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <Button size="sm" className="gap-1.5 shadow-sm font-semibold" asChild>
                <Link href={PATHS.ROOMS}>
                  <Home className="size-4" /> Vào ứng dụng
                </Link>
              </Button>
              <Link href={PATHS.PROFILE} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
                <User className="size-3.5" />
                <span>{userName}</span>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:bg-destructive/10"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href={PATHS.AUTH.LOGIN}>Đăng nhập</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={PATHS.AUTH.REGISTER}>Đăng ký</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
