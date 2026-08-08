'use client'

import * as React from 'react'
import { Camera, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'

export interface OcrUploadCardProps {
  onScan: () => void
}

export function OcrUploadCard({ onScan }: OcrUploadCardProps) {
  return (
    <Card
      className="p-4 border-dashed border-2 border-primary/30 bg-primary/5 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:border-primary transition-colors rounded-2xl"
      onClick={onScan}
    >
      <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
        <Camera className="size-6" />
      </div>
      <div>
        <span className="font-bold text-sm text-foreground flex items-center justify-center gap-1">
          Quét hóa đơn bằng AI <Sparkles className="size-3.5 text-amber-500" />
        </span>
        <span className="text-xs text-muted-foreground block mt-0.5">
          Tải lên ảnh bill (WinMart, Điện, Nước...) để tự động điền
        </span>
      </div>
    </Card>
  )
}
