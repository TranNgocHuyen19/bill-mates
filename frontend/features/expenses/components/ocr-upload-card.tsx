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
      className='flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center transition-colors hover:border-primary'
      onClick={onScan}
    >
      <div className='flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
        <Camera className='size-6' />
      </div>
      <div>
        <span className='flex items-center justify-center gap-1 text-sm font-bold text-foreground'>
          Quét hóa đơn bằng AI <Sparkles className='size-3.5 text-amber-500' />
        </span>
        <span className='mt-0.5 block text-xs text-muted-foreground'>
          Tải lên ảnh bill (WinMart, Điện, Nước...) để tự động điền
        </span>
      </div>
    </Card>
  )
}
