'use client'

import * as React from 'react'
import Link from 'next/link'
import { Plus, Users, ArrowRight, Home, Sparkles, FolderPlus, X } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { showSuccessToast } from '@/lib/toast'
import { PATHS } from '@/constants'

export default function RoomsPage() {
  const [rooms, setRooms] = React.useState<Array<{
    id: string
    name: string
    membersCount: number
    totalExpenses: string
    userBalance: string
    isOwed: boolean
    lastActivity: string
  }>>([])

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [newRoomName, setNewRoomName] = React.useState('')

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomName.trim()) return

    const newRoom = {
      id: `room_${Date.now()}`,
      name: newRoomName.trim(),
      membersCount: 1,
      totalExpenses: '0 ₫',
      userBalance: '0 ₫',
      isOwed: false,
      lastActivity: 'Mới khởi tạo'
    }

    setRooms([newRoom, ...rooms])
    showSuccessToast(`Đã tạo phòng '${newRoomName}' thành công!`)
    setNewRoomName('')
    setIsModalOpen(false)
  }

  const totalRooms = rooms.length
  const totalReceive = rooms.filter(r => r.isOwed).reduce((acc, r) => acc + 320000, 0)
  const totalPay = rooms.filter(r => !r.isOwed && r.userBalance !== '0 ₫').reduce((acc, r) => acc + 150000, 0)

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
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-md shadow-primary/20">
            <Plus className="size-4" /> Tạo nhóm mới
          </Button>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-primary/5 border-primary/20 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tổng phòng đang tham gia</span>
            <span className="text-2xl font-bold text-primary mt-2">{totalRooms} Nhóm</span>
          </Card>
          <Card className="p-4 bg-emerald-500/10 border-emerald-500/20 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Số tiền bạn cần nhận</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
              {totalReceive > 0 ? `+ ${totalReceive.toLocaleString()} ₫` : '0 ₫'}
            </span>
          </Card>
          <Card className="p-4 bg-rose-500/10 border-rose-500/20 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Số tiền bạn cần trả</span>
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
              {totalPay > 0 ? `- ${totalPay.toLocaleString()} ₫` : '0 ₫'}
            </span>
          </Card>
        </div>

        {/* Room List or Empty State */}
        <div className="space-y-4 pt-2">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="size-4 text-amber-500" /> Các phòng đang hoạt động
          </h2>

          {rooms.length === 0 ? (
            <Card className="p-8 text-center flex flex-col items-center justify-center space-y-4 border-dashed border-2 border-primary/20 bg-primary/5">
              <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <FolderPlus className="size-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="font-bold text-lg text-foreground">Bạn chưa tham gia phòng trọ nào</h3>
                <p className="text-xs text-muted-foreground">
                  Hãy tạo phòng trọ đầu tiên hoặc yêu cầu bạn cùng phòng gửi mã mời để bắt đầu quản lý chi tiêu.
                </p>
              </div>
              <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-md">
                <Plus className="size-4" /> Tạo phòng trọ ngay
              </Button>
            </Card>
          ) : (
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
          )}
        </div>
      </main>

      {/* Create Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4 shadow-xl border-primary/20 relative animate-in fade-in zoom-in-95">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="size-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Home className="size-5 text-primary" /> Tạo Phòng Trọ / Nhóm Mới
              </h3>
              <p className="text-xs text-muted-foreground">Nhập tên phòng hoặc chuyến đi để bắt đầu chia tiền nhóm.</p>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <Input
                label="Tên phòng / Nhóm chi tiêu"
                placeholder="VD: Phòng Trọ 101, Chuyến đi Đà Lạt"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                required
                autoFocus
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="submit" className="gap-1.5 font-semibold">
                  <Plus className="size-4" /> Tạo ngay
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
