'use client'

import * as React from 'react'
import Link from 'next/link'
import { Users, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants'

export interface RoomCardProps {
  id: string
  name: string
  membersCount: number
  totalExpenses: string
  userBalance: string
  isOwed: boolean
  lastActivity: string
}

export function RoomCard({
  id,
  name,
  membersCount,
  totalExpenses,
  userBalance,
  isOwed,
  lastActivity
}: RoomCardProps) {
  return (
    <Card className="p-5 hover:border-primary/50 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between group rounded-2xl">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
            {name}
          </h3>
          <Badge variant={isOwed ? 'default' : 'secondary'} className="shrink-0">
            {isOwed ? 'Bạn nhận' : userBalance === '0 ₫' ? 'Đã hòa' : 'Bạn trả'}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" /> {membersCount} thành viên
          </span>
          <span>•</span>
          <span>Tổng chi: <strong className="text-foreground">{totalExpenses}</strong></span>
        </div>

        <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
          {lastActivity}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
        <div>
          <span className="text-[11px] text-muted-foreground block">Số dư của bạn</span>
          <span className={`text-base font-bold ${isOwed ? 'text-emerald-600 dark:text-emerald-400' : userBalance === '0 ₫' ? 'text-foreground' : 'text-rose-600 dark:text-rose-400'}`}>
            {userBalance}
          </span>
        </div>

        <Button variant="outline" size="sm" className="gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors rounded-xl" asChild>
          <Link href={PATHS.ROOM_DETAIL(id)}>
            Vào phòng <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </Card>
  )
}
