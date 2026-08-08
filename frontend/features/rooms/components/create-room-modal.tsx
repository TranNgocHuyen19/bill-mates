'use client'

import * as React from 'react'
import { Home, Plus, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string) => void
}

export function CreateRoomModal({ isOpen, onClose, onSubmit }: CreateRoomModalProps) {
  const [roomName, setRoomName] = React.useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomName.trim()) return
    onSubmit(roomName.trim())
    setRoomName('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-4 shadow-2xl border-primary/20 relative animate-in fade-in zoom-in-95 rounded-3xl">
        <button onClick={onClose} className="absolute top-5 right-5 text-muted-foreground hover:text-foreground">
          <X className="size-5" />
        </button>

        <div className="space-y-1">
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            <Home className="size-5 text-primary" /> Tạo Phòng Trọ / Nhóm Mới
          </h3>
          <p className="text-xs text-muted-foreground">Nhập tên phòng hoặc chuyến đi để bắt đầu chia tiền nhóm.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tên phòng / Nhóm chi tiêu"
            placeholder="VD: Căn Hộ Homies, Chuyến đi Đà Lạt"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            required
            autoFocus
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Hủy</Button>
            <Button type="submit" className="gap-1.5 font-semibold rounded-xl">
              <Plus className="size-4" /> Tạo ngay
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
