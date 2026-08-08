'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Receipt, Plus, CreditCard, User } from 'lucide-react'
import { PATHS } from '@/constants'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()

  // Hide bottom nav on auth pages
  if (pathname.startsWith('/auth') || pathname === '/login' || pathname === '/register') {
    return null
  }

  const navItems = [
    {
      label: 'Tổng quan',
      href: PATHS.ROOM_DETAIL('101'),
      icon: Home,
      isActive: pathname.startsWith('/rooms') || pathname === '/'
    },
    {
      label: 'Công nợ',
      href: PATHS.DEBTS.INDEX,
      icon: CreditCard,
      isActive: pathname.startsWith('/debts')
    },
    {
      label: 'Thêm mới',
      href: PATHS.EXPENSES.NEW,
      icon: Plus,
      isPrimary: true,
      isActive: pathname.startsWith('/expenses')
    },
    {
      label: 'Cá nhân',
      href: PATHS.PROFILE,
      icon: User,
      isActive: pathname.startsWith('/profile')
    }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-lg border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-6 group"
              >
                <div className="size-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
                  <Icon className="size-6" />
                </div>
                <span className="text-[10px] font-semibold text-primary mt-1">
                  {item.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-16 py-1 transition-colors',
                item.isActive
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-5" />
              <span className="text-[11px] font-medium mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
