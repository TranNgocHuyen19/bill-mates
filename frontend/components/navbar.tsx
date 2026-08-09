'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  BarChart3,
  ChevronDown,
  Clock3,
  CreditCard,
  Home,
  Loader2,
  LogOut,
  ReceiptText,
  User,
  Wallet,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LoginModal, useLogoutMutation } from '@/features/auth'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { PATHS } from '@/constants'
import { cn } from '@/lib/utils'

const mobileDrawerLinkClass =
  'flex min-h-11 min-w-0 items-center gap-2.5 rounded-xl bg-muted/40 px-3 py-2 text-[13px] font-semibold leading-tight transition-colors hover:bg-primary/10 hover:text-primary'

export function Navbar() {
  const [user, setUser] = React.useState<SupabaseUser | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [isLoginOpen, setIsLoginOpen] = React.useState(false)
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

  React.useEffect(() => {
    if (!isMenuOpen) return

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isMenuOpen])

  const userName =
    user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Thành viên'

  return (
    <>
      <header className='sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg transition-colors'>
        <div className='mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6'>
          {/* Logo */}
          <Link href='/' className='flex shrink-0 items-center gap-1.5 min-[340px]:gap-2'>
            <div className='flex size-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shadow-xs sm:size-9'>
              <Wallet className='size-4 text-primary sm:size-5' />
            </div>
            <span className='hidden text-lg font-bold tracking-tight text-primary min-[340px]:inline sm:text-xl'>
              BillMates
            </span>
          </Link>

          {/* Desktop Links */}
          <nav className='hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex'>
            <a href='#features' className='transition-colors hover:text-foreground'>
              Tính năng
            </a>
            <a href='#how-it-works' className='transition-colors hover:text-foreground'>
              Cách hoạt động
            </a>
            <a href='#faq' className='transition-colors hover:text-foreground'>
              Câu hỏi thường gặp
            </a>
          </nav>

          {/* Action Button / Profile Trigger */}
          <div className='flex shrink-0 items-center gap-2'>
            {loading ? (
              <div className='flex size-8 items-center justify-center'>
                <Loader2 className='size-4 animate-spin text-muted-foreground' />
              </div>
            ) : user ? (
              <div className='relative' ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className='flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary shadow-xs transition-all hover:bg-primary/20 focus:outline-none active:scale-95 sm:px-3'
                >
                  <div className='flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-xs'>
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className='max-w-[82px] truncate min-[360px]:max-w-[100px] sm:max-w-[140px]'>{userName}</span>
                  <ChevronDown
                    className={cn('size-3.5 transition-transform duration-200', isMenuOpen && 'rotate-180')}
                  />
                </button>

                {/* Desktop Floating Dropdown Menu (hidden on mobile) */}
                {isMenuOpen && (
                  <div className='absolute right-0 z-50 mt-2 hidden w-56 animate-in rounded-2xl border border-border bg-card py-2 shadow-xl zoom-in-95 fade-in md:block'>
                    <div className='border-b border-border px-4 py-2'>
                      <p className='truncate text-xs font-bold text-foreground'>{userName}</p>
                      <p className='truncate text-[11px] text-muted-foreground'>{user.email}</p>
                    </div>

                    <div className='py-1'>
                      <Link
                        href={PATHS.ROOMS}
                        onClick={() => setIsMenuOpen(false)}
                        className='flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-primary/10 hover:text-primary'
                      >
                        <Home className='size-4 text-primary' />
                        <span>Vào ứng dụng (Phòng)</span>
                      </Link>

                      <Link
                        href={PATHS.EXPENSES.INDEX}
                        onClick={() => setIsMenuOpen(false)}
                        className='flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-primary/10 hover:text-primary'
                      >
                        <ReceiptText className='size-4 text-primary' />
                        <span>Đơn nháp & khoản chi</span>
                      </Link>

                      <Link
                        href={PATHS.DEBTS.INDEX}
                        onClick={() => setIsMenuOpen(false)}
                        className='flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-primary/10 hover:text-primary'
                      >
                        <CreditCard className='size-4 text-primary' />
                        <span>Quản lý công nợ</span>
                      </Link>

                      <Link
                        href={PATHS.REPORTS}
                        onClick={() => setIsMenuOpen(false)}
                        className='flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-primary/10 hover:text-primary'
                      >
                        <BarChart3 className='size-4 text-primary' />
                        <span>Báo cáo chi tiêu</span>
                      </Link>

                      <Link
                        href={PATHS.PROFILE}
                        onClick={() => setIsMenuOpen(false)}
                        className='flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-primary/10 hover:text-primary'
                      >
                        <User className='size-4 text-primary' />
                        <span>Tài khoản & Cài đặt</span>
                      </Link>

                      <Link
                        href={PATHS.HISTORY}
                        onClick={() => setIsMenuOpen(false)}
                        className='flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-primary/10 hover:text-primary'
                      >
                        <Clock3 className='size-4 text-primary' />
                        <span>Lịch sử hoạt động</span>
                      </Link>
                    </div>

                    <div className='border-t border-border pt-1'>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false)
                          logoutMutation.mutate()
                        }}
                        disabled={logoutMutation.isPending}
                        className='flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10'
                      >
                        <LogOut className='size-4' />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button variant='ghost' size='sm' asChild>
                  <button type='button' onClick={() => setIsLoginOpen(true)}>
                    Đăng nhập
                  </button>
                </Button>
                <Button size='sm' asChild>
                  <Link href={PATHS.AUTH.REGISTER}>Đăng ký</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      {isMenuOpen && user && (
        <div className='fixed inset-0 z-50 animate-in bg-black/45 duration-200 fade-in md:hidden'>
          <button
            type='button'
            className='absolute inset-0 cursor-default backdrop-blur-xs'
            aria-label='Đóng menu'
            onClick={() => setIsMenuOpen(false)}
          />

          <aside
            role='dialog'
            aria-modal='true'
            aria-label='Menu tài khoản'
            className='relative my-3 mr-3 ml-auto flex h-[min(38rem,calc(100dvh-1.5rem))] w-[min(76vw,320px)] animate-in flex-col overflow-y-auto rounded-3xl border border-border bg-card px-3.5 pt-[max(0.875rem,env(safe-area-inset-top))] pb-[max(0.875rem,env(safe-area-inset-bottom))] shadow-2xl duration-300 slide-in-from-right'
          >
            <button
              type='button'
              onClick={() => setIsMenuOpen(false)}
              className='absolute top-1.5 right-1.5 grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
              aria-label='Đóng menu'
            >
              <X className='size-5' />
            </button>

            <div className='flex min-w-0 items-center gap-2.5 border-b border-border pt-8 pr-10 pb-3.5'>
              <div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground shadow-md'>
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className='min-w-0 space-y-0.5 overflow-hidden'>
                <p className='truncate text-sm font-bold text-foreground'>{userName}</p>
                <p className='truncate text-[11px] text-muted-foreground'>{user.email}</p>
              </div>
            </div>

            <nav className='mt-3 space-y-1' aria-label='Điều hướng tài khoản'>
              <Link href={PATHS.ROOMS} onClick={() => setIsMenuOpen(false)} className={mobileDrawerLinkClass}>
                <Home className='size-4 shrink-0 text-primary' />
                <span className='min-w-0'>Vào ứng dụng (Danh sách phòng)</span>
              </Link>

              <Link href={PATHS.EXPENSES.INDEX} onClick={() => setIsMenuOpen(false)} className={mobileDrawerLinkClass}>
                <ReceiptText className='size-4 shrink-0 text-primary' />
                <span className='min-w-0'>Đơn nháp & khoản chi</span>
              </Link>

              <Link href={PATHS.DEBTS.INDEX} onClick={() => setIsMenuOpen(false)} className={mobileDrawerLinkClass}>
                <CreditCard className='size-4 shrink-0 text-primary' />
                <span className='min-w-0'>Quản lý công nợ</span>
              </Link>

              <Link href={PATHS.REPORTS} onClick={() => setIsMenuOpen(false)} className={mobileDrawerLinkClass}>
                <BarChart3 className='size-4 shrink-0 text-primary' />
                <span className='min-w-0'>Báo cáo chi tiêu & xuất Excel</span>
              </Link>

              <Link href={PATHS.PROFILE} onClick={() => setIsMenuOpen(false)} className={mobileDrawerLinkClass}>
                <User className='size-4 shrink-0 text-primary' />
                <span className='min-w-0'>Tài khoản & Cài đặt</span>
              </Link>

              <Link href={PATHS.HISTORY} onClick={() => setIsMenuOpen(false)} className={mobileDrawerLinkClass}>
                <Clock3 className='size-4 shrink-0 text-primary' />
                <span className='min-w-0'>Lịch sử hoạt động</span>
              </Link>
            </nav>

            <Button
              variant='destructive'
              className='mt-auto h-11 w-full gap-2 rounded-xl text-xs font-semibold'
              onClick={() => {
                setIsMenuOpen(false)
                logoutMutation.mutate()
              }}
              disabled={logoutMutation.isPending}
            >
              <LogOut className='size-4' /> Đăng xuất khỏi thiết bị
            </Button>
          </aside>
        </div>
      )}

      <LoginModal open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </>
  )
}
