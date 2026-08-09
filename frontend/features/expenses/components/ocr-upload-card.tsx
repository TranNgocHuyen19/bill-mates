'use client'

import * as React from 'react'
import { Camera, ImagePlus, Loader2, ReceiptText, Sparkles } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type ReceiptUploadStage = 'idle' | 'uploading' | 'scanning'

export interface OcrUploadCardProps {
  file: File | null
  onFileChange: (file: File | null) => void
  stage?: ReceiptUploadStage
  disabled?: boolean
}

const stageLabels: Record<Exclude<ReceiptUploadStage, 'idle'>, string> = {
  uploading: 'Đang lưu ảnh vào Supabase...',
  scanning: 'PaddleOCR đang đọc từng dòng...'
}

export function OcrUploadCard({ file, onFileChange, stage = 'idle', disabled = false }: OcrUploadCardProps) {
  const inputId = React.useId()
  const [previewUrl] = React.useState(() => (file ? URL.createObjectURL(file) : null))
  const isProcessing = stage !== 'idle'

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  return (
    <Card
      className={cn(
        'overflow-hidden rounded-2xl border-dashed p-0 transition-colors',
        file ? 'border-primary/30 bg-primary/[0.035]' : 'border-outline-variant bg-muted/25'
      )}
    >
      <label
        htmlFor={inputId}
        className={cn(
          'flex min-h-24 cursor-pointer items-center gap-3 p-3 sm:p-4',
          (disabled || isProcessing) && 'pointer-events-none opacity-70'
        )}
      >
        {previewUrl ? (
          <span className='relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt='Ảnh hóa đơn đã chọn' className='size-full object-cover' />
            <span className='absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center text-[10px] font-semibold text-white'>
              Xem trước
            </span>
          </span>
        ) : (
          <span className='grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary'>
            <Camera className='size-6' aria-hidden='true' />
          </span>
        )}

        <span className='min-w-0 flex-1'>
          <span className='flex items-center gap-1.5 text-sm font-bold'>
            {file ? <ReceiptText className='size-4 text-primary' /> : <Sparkles className='size-4 text-amber-500' />}
            {file ? 'Bill sẵn sàng để quét' : 'Quét bill bằng PaddleOCR'}
          </span>
          <span className='mt-1 block truncate text-xs text-muted-foreground'>
            {file?.name ?? 'Chụp hoặc chọn JPEG, PNG, WebP · tối đa 10 MB'}
          </span>
          <span className='mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 text-xs font-semibold text-primary'>
            <ImagePlus className='size-3.5' />
            {file ? 'Đổi ảnh' : 'Chọn ảnh hóa đơn'}
          </span>
        </span>
      </label>

      <input
        id={inputId}
        type='file'
        accept='image/jpeg,image/png,image/webp'
        className='sr-only'
        disabled={disabled || isProcessing}
        aria-label='Chọn ảnh hóa đơn để quét'
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />

      {isProcessing ? (
        <div className='flex items-center gap-2 border-t border-primary/10 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary'>
          <Loader2 className='size-4 animate-spin' aria-hidden='true' />
          <span role='status'>{stageLabels[stage]}</span>
        </div>
      ) : null}
    </Card>
  )
}
