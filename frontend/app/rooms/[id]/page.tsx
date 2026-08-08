'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plus, Users, Receipt, ArrowDownLeft, ChevronRight, Sparkles, Share2, FolderPlus, UserPlus } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { showSuccessToast } from '@/lib/toast'
import { PATHS } from '@/constants'

export default function RoomDetailPage() {
  const params = useParams()
  const roomId = (params?.id as string) || ''
  const [roomName, setRoomName] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined' && roomId) {
      try {
        const saved = localStorage.getItem('bill_mates_rooms_list')
        if (saved) {
          const list = JSON.parse(saved)
          const found = list.find((r: { id: string; name: string }) => r.id === roomId)
          if (found && found.name) {
            setRoomName(found.name)
            return
          }
        }
      } catch (e) {
        console.error('Failed to read room name from localStorage:', e)
      }
    }
  }, [roomId])

  // Dynamic state without mock data
  const [members] = useState<
    Array<{ name: string; role: string; balance: string; isPositive: boolean }>
  >([{ name: 'Bạn (Trưởng phòng)', role: 'Trưởng phòng', balance: '0 ₫', isPositive: true }])

  const [expenses] = useState<
    Array<{
      id: string
      title: string
      payer: string
      amount: string
      date: string
      splitMethod: string
      icon: string
    }>
  >([])

  const totalExpensesAmount = expenses.reduce((acc, curr) => acc + parseInt(curr.amount.replace(/\D/g, '') || '0'), 0)

  const handleShareInvite = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/rooms/join/${roomId}`)
      showSuccessToast('Đã sao chép liên kết mời tham gia phòng!')
    }
  }

  const displayName = roomName || (roomId ? `Phòng #${roomId}` : 'Chi tiết phòng')

  return (
    <div className='flex min-h-screen flex-col bg-background font-sans text-foreground'>
      <Navbar />

      <main className='mx-auto w-full max-w-5xl flex-1 space-y-5 px-4 py-4 sm:space-y-6 sm:py-8'>
        {/* Top Room Banner */}
        <div className='flex flex-col justify-between gap-4 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 shadow-xs sm:flex-row sm:items-center sm:p-6'>
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <Badge variant='default' className='text-xs'>
                Mã phòng: {roomId || 'N/A'}
              </Badge>
              <span className='text-xs text-muted-foreground'>{members.length} Thành viên</span>
            </div>
            <h1 className='text-xl font-bold tracking-tight text-foreground sm:text-3xl'>{displayName}</h1>
            <p className='text-xs text-muted-foreground sm:text-sm'>
              Quản lý hóa đơn chi tiêu & tính toán chia tiền nhóm tự động.
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' className='h-10 gap-1.5 rounded-xl text-xs' onClick={handleShareInvite}>
              <Share2 className='size-4' /> Mời bạn
            </Button>
            <Button
              size='sm'
              className='h-10 gap-1.5 rounded-xl text-xs font-semibold shadow-md shadow-primary/20'
              asChild
            >
              <Link href={PATHS.EXPENSES.NEW}>
                <Plus className='size-4' /> Thêm khoản chi
              </Link>
            </Button>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4'>
          <Card className='space-y-2 rounded-2xl border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-semibold uppercase text-muted-foreground'>Số tiền bạn nhận</span>
              <div className='flex size-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'>
                <ArrowDownLeft className='size-4' />
              </div>
            </div>
            <div className='text-xl font-bold text-emerald-600 sm:text-2xl dark:text-emerald-400'>0 ₫</div>
            <p className='text-[11px] text-muted-foreground'>Chưa có khoản nợ phát sinh</p>
          </Card>

          <Card className='space-y-2 rounded-2xl border-border bg-card p-4 sm:p-5'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-semibold uppercase text-muted-foreground'>Tổng chi tiêu nhóm</span>
              <div className='flex size-8 items-center justify-center rounded-full bg-primary/20 text-primary'>
                <Receipt className='size-4' />
              </div>
            </div>
            <div className='text-xl font-bold text-foreground sm:text-2xl'>
              {totalExpensesAmount > 0 ? `${totalExpensesAmount.toLocaleString()} ₫` : '0 ₫'}
            </div>
            <p className='text-[11px] text-muted-foreground'>{expenses.length} Hóa đơn đã tạo</p>
          </Card>

          <Card className='space-y-2 rounded-2xl border-amber-500/30 bg-amber-500/5 p-4 sm:p-5'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-semibold uppercase text-muted-foreground'>Tối ưu hóa dòng tiền</span>
              <div className='flex size-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400'>
                <Sparkles className='size-4' />
              </div>
            </div>
            <div className='text-sm font-bold text-foreground'>0 Giao dịch cần xử lý</div>
            <Button variant='link' size='sm' className='h-auto p-0 text-xs font-semibold text-primary' asChild>
              <Link href={PATHS.DEBTS.INDEX}>
                Chi tiết công nợ <ChevronRight className='size-3' />
              </Link>
            </Button>
          </Card>
        </div>

        {/* Two Columns: Recent Expenses & Room Members */}
        <div className='grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3'>
          {/* Left Column: Recent Expenses */}
          <div className='space-y-4 lg:col-span-2'>
            <div className='flex items-center justify-between'>
              <h2 className='flex items-center gap-2 text-base font-bold text-foreground sm:text-lg'>
                <Receipt className='size-5 text-primary' /> Hóa đơn gần đây
              </h2>
              <Button variant='ghost' size="sm" className="text-xs" asChild>
                <Link href={PATHS.EXPENSES.NEW}>+ Tạo mới</Link>
              </Button>
            </div>

            {expenses.length === 0 ? (
              <Card className='flex flex-col items-center justify-center space-y-3 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 p-6 text-center'>
                <div className='flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
                  <FolderPlus className='size-6' />
                </div>
                <div className='space-y-0.5'>
                  <h3 className='text-sm font-bold text-foreground'>Chưa có hóa đơn nào</h3>
                  <p className='text-xs text-muted-foreground'>
                    Tạo khoản chi đầu tiên để phân chia tiền nhà, điện nước hoặc ăn uống.
                  </p>
                </div>
                <Button size='sm' className='gap-1.5 rounded-xl font-semibold' asChild>
                  <Link href={PATHS.EXPENSES.NEW}>
                    <Plus className='size-4' /> Thêm khoản chi mới
                  </Link>
                </Button>
              </Card>
            ) : (
              <div className='space-y-3'>
                {expenses.map((exp) => (
                  <Card
                    key={exp.id}
                    className='flex items-center justify-between gap-4 rounded-2xl p-4 transition-colors hover:border-primary/40'
                  >
                    <div className='flex items-center gap-3.5'>
                      <div className='flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-xl'>
                        {exp.icon}
                      </div>
                      <div>
                        <h4 className='text-sm font-bold text-foreground'>{exp.title}</h4>
                        <div className='mt-0.5 flex items-center gap-2 text-xs text-muted-foreground'>
                          <span>
                            Người chi: <strong>{exp.payer}</strong>
                          </span>
                          <span>•</span>
                          <span>{exp.splitMethod}</span>
                        </div>
                      </div>
                    </div>

                    <div className='shrink-0 text-right'>
                      <span className='block text-sm font-bold text-foreground'>{exp.amount}</span>
                      <span className='text-[11px] text-muted-foreground'>{exp.date}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Room Members */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h2 className='flex items-center gap-2 text-base font-bold text-foreground sm:text-lg'>
                <Users className='size-5 text-primary' /> Thành viên ({members.length})
              </h2>
            </div>

            <Card className='space-y-3 rounded-2xl p-4'>
              {members.map((m, idx) => (
                <div key={idx} className='flex items-center justify-between border-b border-border py-2 last:border-0'>
                  <div>
                    <span className='block text-sm font-semibold text-foreground'>{m.name}</span>
                    <span className='text-xs text-muted-foreground'>{m.role}</span>
                  </div>

                  <span
                    className={`text-xs font-bold ${m.balance === '0 ₫' ? 'text-muted-foreground' : m.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                  >
                    {m.balance}
                  </span>
                </div>
              ))}

              <Button
                variant='outline'
                size='sm'
                className='mt-2 h-10 w-full gap-1.5 rounded-xl text-xs'
                onClick={handleShareInvite}
              >
                <UserPlus className='size-4 text-primary' /> Mời bạn cùng phòng
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
