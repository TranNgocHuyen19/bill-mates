'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plus, CreditCard, User } from 'lucide-react'
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
      href: PATHS.ROOMS,
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border md:hidden shadow-lg">
      <div className="grid grid-cols-4 items-center h-16 max-w-md mx-auto w-full px-1">
        {navItems.map((item) => {
          const Icon = item.icon

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5 group col-span-1"
              >
                <div className="size-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/30 group-hover:scale-105 transition-transform">
                  <Icon className="size-5" />
                </div>
                <span className="text-[10px] font-bold text-primary mt-1">
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
                'flex flex-col items-center justify-center col-span-1 py-1 transition-colors h-full',
                item.isActive
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-5" />
              <span className="text-[10px] font-semibold mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
