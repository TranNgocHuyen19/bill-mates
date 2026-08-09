'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, CreditCard, Home, Plus, User } from 'lucide-react'
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
      label: 'Báo cáo',
      href: PATHS.REPORTS,
      icon: BarChart3,
      isActive: pathname.startsWith('/reports')
    },
    {
      label: 'Cá nhân',
      href: PATHS.PROFILE,
      icon: User,
      isActive: pathname.startsWith('/profile')
    }
  ]

  return (
    <nav className='fixed right-0 bottom-0 left-0 z-40 border-t border-border bg-card/95 shadow-lg backdrop-blur-lg md:hidden'>
      <div className='mx-auto grid h-16 w-full max-w-md grid-cols-5 items-center px-1'>
        {navItems.map((item) => {
          const Icon = item.icon

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className='group col-span-1 -mt-5 flex flex-col items-center justify-center'
              >
                <div className='flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30 transition-transform group-hover:scale-105'>
                  <Icon className='size-5' />
                </div>
                <span className='mt-1 text-[10px] font-bold text-primary'>{item.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'col-span-1 flex h-full flex-col items-center justify-center py-1 transition-colors',
                item.isActive ? 'font-bold text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className='size-5' />
              <span className='mt-1 text-[10px] font-semibold'>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
