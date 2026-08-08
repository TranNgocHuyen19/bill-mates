'use client'

import * as React from 'react'
import Link from 'next/link'
import { Wallet, LogOut, User, Loader2, Home, CreditCard, ChevronDown, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useLogoutMutation } from '@/features/auth/queries'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { PATHS } from '@/constants'
import { cn } from '@/lib/utils'

export function Navbar() {
  const [user, setUser] = React.useState<SupabaseUser | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)
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

  // Close desktop dropdown menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Thành viên'

  return (
    <>
      <header className="border-b border-border bg-card/80 backdrop-blur-lg sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="size-8 sm:size-9 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shadow-xs">
              <Wallet className="size-4 sm:size-5 text-primary" />
            </div>
            <span className="font-bold text-lg sm:text-xl tracking-tight text-primary">BillMates</span>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Tính năng</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">Cách hoạt động</a>
            <a href="#faq" className="hover:text-foreground transition-colors">Câu hỏi thường gặp</a>
          </nav>

          {/* Action Button / Profile Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            {loading ? (
              <div className="size-8 flex items-center justify-center">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 text-xs font-semibold text-primary transition-all shadow-xs focus:outline-none active:scale-95"
                >
                  <div className="size-6 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shadow-xs">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] sm:max-w-[140px] truncate">{userName}</span>
                  <ChevronDown className={cn('size-3.5 transition-transform duration-200', isMenuOpen && 'rotate-180')} />
                </button>

                {/* Desktop Floating Dropdown Menu (hidden on mobile) */}
                {isMenuOpen && (
                  <div className="hidden md:block absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-xs font-bold text-foreground truncate">{userName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        href={PATHS.ROOMS}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Home className="size-4 text-primary" />
                        <span>Vào ứng dụng (Phòng)</span>
                      </Link>

                      <Link
                        href={PATHS.DEBTS.INDEX}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <CreditCard className="size-4 text-primary" />
                        <span>Quản lý công nợ</span>
                      </Link>

                      <Link
                        href={PATHS.PROFILE}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <User className="size-4 text-primary" />
                        <span>Tài khoản & Cài đặt</span>
                      </Link>
                    </div>

                    <div className="border-t border-border pt-1">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false)
                          logoutMutation.mutate()
                        }}
                        disabled={logoutMutation.isPending}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors text-left"
                      >
                        <LogOut className="size-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
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

      {/* Mobile-First Sliding Bottom Sheet Menu (Shown only on mobile screens md:hidden) */}
      {isMenuOpen && user && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          {/* Backdrop click to dismiss */}
          <div className="flex-1" onClick={() => setIsMenuOpen(false)} />

          {/* Bottom Sheet Drawer */}
          <div className="bg-card border-t border-border rounded-t-3xl p-6 space-y-5 animate-in slide-in-from-bottom duration-300 shadow-2xl relative">
            {/* Drag Handle Indicator */}
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto" />

            {/* Close Button */}
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>

            {/* User Profile Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="size-12 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center shadow-md shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                <p className="font-bold text-base text-foreground truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            {/* Menu Options */}
            <div className="space-y-2">
              <Link
                href={PATHS.ROOMS}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/40 hover:bg-primary/10 hover:text-primary text-sm font-semibold transition-colors"
              >
                <Home className="size-5 text-primary" />
                <span>Vào ứng dụng (Danh sách phòng)</span>
              </Link>

              <Link
                href={PATHS.DEBTS.INDEX}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/40 hover:bg-primary/10 hover:text-primary text-sm font-semibold transition-colors"
              >
                <CreditCard className="size-5 text-primary" />
                <span>Quản lý công nợ</span>
              </Link>

              <Link
                href={PATHS.PROFILE}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/40 hover:bg-primary/10 hover:text-primary text-sm font-semibold transition-colors"
              >
                <User className="size-5 text-primary" />
                <span>Tài khoản & Cài đặt</span>
              </Link>
            </div>

            {/* Logout Button */}
            <Button
              variant="destructive"
              className="w-full h-12 text-sm font-semibold gap-2 rounded-2xl"
              onClick={() => {
                setIsMenuOpen(false)
                logoutMutation.mutate()
              }}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="size-4" /> Đăng xuất khỏi thiết bị
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
