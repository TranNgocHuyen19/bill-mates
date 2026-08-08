'use client'

import * as React from 'react'
import Link from 'next/link'
import { Plus, Users, ArrowRight, Home, Shield, Sparkles } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PATHS } from '@/constants'

export default function RoomsPage() {
  const rooms = [
    {
      id: '101',
      name: 'Phòng Trọ 101 - Căn Hộ Homies',
      membersCount: 4,
      totalExpenses: '4.250.000 ₫',
      userBalance: '+ 320.000 ₫',
      isOwed: true,
      lastActivity: 'Hôm qua: Tiền điện tháng 8'
    },
    {
      id: 'dalat-2026',
      name: 'Chuyến Đi Đà Lạt 3N2Đ',
      membersCount: 6,
      totalExpenses: '8.900.000 ₫',
      userBalance: '- 150.000 ₫',
      isOwed: false,
      lastActivity: '3 ngày trước: Tiền thuê xe máy'
    },
    {
      id: 'foodies',
      name: 'Team Ăn Trưa Công Ty',
      membersCount: 5,
      totalExpenses: '1.420.000 ₫',
      userBalance: '0 ₫',
      isOwed: false,
      lastActivity: 'Tuần trước: Trà sữa Cầu Giấy'
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 md:py-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Home className="size-7 text-primary" /> Danh Sách Phòng & Nhóm
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Chọn phòng để quản lý hóa đơn và tính toán số dư từng thành viên.
            </p>
          </div>
          <Button className="gap-2 shadow-md shadow-primary/20" asChild>
            <Link href={PATHS.ROOMS}>
              <Plus className="size-4" /> Tạo nhóm mới
            </Link>
          </Button>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-primary/5 border-primary/20 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tổng phòng đang tham gia</span>
            <span className="text-2xl font-bold text-primary mt-2">3 Nhóm</span>
          </Card>
          <Card className="p-4 bg-emerald-500/10 border-emerald-500/20 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Số tiền bạn cần nhận</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">+ 320.000 ₫</span>
          </Card>
          <Card className="p-4 bg-rose-500/10 border-rose-500/20 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Số tiền bạn cần trả</span>
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">- 150.000 ₫</span>
          </Card>
        </div>

        {/* Room List */}
        <div className="space-y-4 pt-2">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="size-4 text-amber-500" /> Các phòng đang hoạt động
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <Card
                key={room.id}
                className="p-5 hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {room.name}
                    </h3>
                    <Badge variant={room.isOwed ? 'default' : 'secondary'} className="shrink-0">
                      {room.isOwed ? 'Bạn nhận' : room.userBalance === '0 ₫' ? 'Đã hòa' : 'Bạn trả'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" /> {room.membersCount} thành viên
                    </span>
                    <span>•</span>
                    <span>Tổng chi: <strong className="text-foreground">{room.totalExpenses}</strong></span>
                  </div>

                  <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                    {room.lastActivity}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Số dư của bạn</span>
                    <span className={`text-base font-bold ${room.isOwed ? 'text-emerald-600 dark:text-emerald-400' : room.userBalance === '0 ₫' ? 'text-foreground' : 'text-rose-600 dark:text-rose-400'}`}>
                      {room.userBalance}
                    </span>
                  </div>

                  <Button variant="outline" size="sm" className="gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                    <Link href={PATHS.ROOM_DETAIL(room.id)}>
                      Vào phòng <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
