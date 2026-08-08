'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Users, UserPlus } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PATHS } from '@/constants'

export default function NewExpenseStep2SplitPage() {
  const router = useRouter()
  const [splitType, setSplitType] = useState<'equal' | 'itemized' | 'percentage'>('equal')
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([
    { id: 'm1', name: 'Bạn (Người trả tiền)' }
  ])
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['m1'])
  const [newMemberName, setNewMemberName] = useState('')

  const [title, setTitle] = useState('Khoản chi mới')
  const [amountNum, setAmountNum] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTitle = sessionStorage.getItem('draft_expense_title')
      const savedAmount = sessionStorage.getItem('draft_expense_amount')
      if (savedTitle) setTitle(savedTitle)
      if (savedAmount) setAmountNum(parseInt(savedAmount, 10) || 0)
    }
  }, [])

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemberName.trim()) return

    const newId = `m_${Date.now()}`
    const newMember = { id: newId, name: newMemberName.trim() }
    setMembers([...members, newMember])
    setSelectedMembers([...selectedMembers, newId])
    setNewMemberName('')
  }

  const toggleMember = (id: string) => {
    if (selectedMembers.includes(id)) {
      if (selectedMembers.length > 1) {
        setSelectedMembers(selectedMembers.filter((m) => m !== id))
      }
    } else {
      setSelectedMembers([...selectedMembers, id])
    }
  }

  const handleNext = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('draft_expense_split_type', splitType)
      sessionStorage.setItem('draft_expense_members_count', String(selectedMembers.length))
    }
    router.push(PATHS.EXPENSES.CONFIRM)
  }

  const amountPerPerson = selectedMembers.length > 0 ? Math.round(amountNum / selectedMembers.length) : 0

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 sm:py-8 space-y-5 sm:space-y-6">
        {/* Wizard Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
            <Link href={PATHS.EXPENSES.NEW}>
              <ArrowLeft className="size-4" /> Bước 1
            </Link>
          </Button>
          <div className="text-xs font-semibold text-muted-foreground">
            Bước <span className="text-primary font-bold">2</span> / 3
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Chọn Phương Thức Chia Tiền</h1>
          <p className="text-xs text-muted-foreground">
            Khoản chi: <strong className="text-foreground">{title} ({amountNum.toLocaleString()} ₫)</strong>
          </p>
        </div>

        {/* Split Option Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card
            className={`p-4 border-2 cursor-pointer transition-all rounded-2xl ${splitType === 'equal' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            onClick={() => setSplitType('equal')}
          >
            <div className="space-y-1.5">
              <Badge variant={splitType === 'equal' ? 'default' : 'secondary'}>Phổ biến</Badge>
              <h3 className="font-bold text-sm">Chia Đều</h3>
              <p className="text-[11px] text-muted-foreground">Tất cả thành viên chia đều số tiền bằng nhau.</p>
            </div>
          </Card>

          <Card
            className={`p-4 border-2 cursor-pointer transition-all rounded-2xl ${splitType === 'itemized' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            onClick={() => setSplitType('itemized')}
          >
            <div className="space-y-1.5">
              <Badge variant="outline">Chi tiết</Badge>
              <h3 className="font-bold text-sm">Theo Món / Bill</h3>
              <p className="text-[11px] text-muted-foreground">Ai ăn/dùng món nào sẽ trả đúng món đó.</p>
            </div>
          </Card>

          <Card
            className={`p-4 border-2 cursor-pointer transition-all rounded-2xl ${splitType === 'percentage' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            onClick={() => setSplitType('percentage')}
          >
            <div className="space-y-1.5">
              <Badge variant="outline">Tỷ lệ</Badge>
              <h3 className="font-bold text-sm">Theo Tỷ Lệ %</h3>
              <p className="text-[11px] text-muted-foreground">Phân chia theo phần trăm hoặc số ngày ở.</p>
            </div>
          </Card>
        </div>

        {/* Member Selector & Dynamic Input */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
              <Users className="size-4 text-primary" /> Người tham gia ({selectedMembers.length}/{members.length})
            </h3>
            <span className="text-xs text-primary font-bold">
              {amountPerPerson.toLocaleString()} ₫ / người
            </span>
          </div>

          {/* Form to add custom member by name */}
          <form onSubmit={handleAddMember} className="flex gap-2">
            <Input
              placeholder="Nhập tên người cùng chia (VD: An, Bình, Cường...)"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="h-10 text-xs rounded-xl flex-1 bg-card"
            />
            <Button type="submit" size="sm" variant="outline" className="h-10 gap-1 rounded-xl text-xs shrink-0">
              <UserPlus className="size-3.5" /> Thêm người
            </Button>
          </form>

          {/* Members list */}
          <div className="space-y-2">
            {members.map((member) => {
              const isSelected = selectedMembers.includes(member.id)
              return (
                <div
                  key={member.id}
                  onClick={() => toggleMember(member.id)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${isSelected ? 'border-primary/50 bg-primary/5' : 'border-border opacity-60'}`}
                >
                  <span className="font-medium text-sm text-foreground">{member.name}</span>
                  <div className={`size-5 rounded-md flex items-center justify-center ${isSelected ? 'bg-primary text-primary-foreground' : 'border border-border'}`}>
                    {isSelected && <Check className="size-3.5" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button onClick={handleNext} className="w-full sm:w-auto px-8 gap-2 font-semibold h-11 rounded-2xl">
            Xác nhận thông tin <ArrowRight className="size-4" />
          </Button>
        </div>
      </main>
    </div>
  )
}
