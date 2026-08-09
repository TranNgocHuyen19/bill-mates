'use client'

import * as React from 'react'
import { Camera, ImagePlus, Images, Loader2, Plus, ReceiptText, Sparkles, X } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type ReceiptUploadStage = 'idle' | 'uploading' | 'scanning'

export interface ReceiptUploadProgress {
  current: number
  total: number
}

export interface OcrUploadCardProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  stage?: ReceiptUploadStage
  progress?: ReceiptUploadProgress | null
  disabled?: boolean
}

interface ReceiptPreviewProps {
  file: File
  index: number
  disabled: boolean
  onRemove: () => void
}

const stageLabels: Record<Exclude<ReceiptUploadStage, 'idle'>, string> = {
  uploading: 'Đang lưu ảnh vào Supabase...',
  scanning: 'PaddleOCR đang đọc từng dòng...'
}

function ReceiptPreview({ file, index, disabled, onRemove }: ReceiptPreviewProps) {
  const previewUrl = React.useMemo(() => URL.createObjectURL(file), [file])

  React.useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl])

  return (
    <div className='group relative aspect-[4/5] min-w-0 overflow-hidden rounded-xl border border-border bg-muted'>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={previewUrl} alt={`Ảnh hóa đơn ${index + 1}`} className='size-full object-cover' />
      <span className='absolute bottom-1.5 left-1.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-white'>
        Ảnh {index + 1}
      </span>
      <button
        type='button'
        className='absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-black/65 text-white shadow-sm transition hover:bg-destructive disabled:pointer-events-none disabled:opacity-50'
        aria-label={`Xóa ảnh hóa đơn ${index + 1}`}
        disabled={disabled}
        onClick={onRemove}
      >
        <X className='size-4' />
      </button>
    </div>
  )
}

export function OcrUploadCard({
  files,
  onFilesChange,
  stage = 'idle',
  progress = null,
  disabled = false
}: OcrUploadCardProps) {
  const inputId = React.useId()
  const isProcessing = stage !== 'idle'
  const hasFiles = files.length > 0
  const progressLabel = progress && progress.total > 1 ? ` Ảnh ${progress.current}/${progress.total}.` : ''

  return (
    <Card
      className={cn(
        'overflow-hidden rounded-2xl border-dashed p-0 transition-colors',
        hasFiles ? 'border-primary/30 bg-primary/[0.035]' : 'border-outline-variant bg-muted/25'
      )}
    >
      <div className='space-y-3 p-3 sm:p-4'>
        <div className='flex items-center gap-3'>
          <span className='grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary'>
            {hasFiles ? <Images className='size-5' /> : <Camera className='size-6' />}
          </span>
          <span className='min-w-0 flex-1'>
            <span className='flex items-center gap-1.5 text-sm font-bold'>
              {hasFiles ? (
                <ReceiptText className='size-4 text-primary' />
              ) : (
                <Sparkles className='size-4 text-amber-500' />
              )}
              {hasFiles ? `${files.length} ảnh bill sẵn sàng` : 'Quét bill bằng PaddleOCR'}
            </span>
            <span className='mt-1 block text-xs leading-5 text-muted-foreground'>
              {hasFiles
                ? 'Có thể thêm nhiều ảnh nếu hóa đơn dài hoặc bị chia thành nhiều màn hình.'
                : 'Chụp hoặc chọn nhiều JPEG, PNG, WebP · tối đa 10 MB mỗi ảnh'}
            </span>
          </span>
          <label
            htmlFor={inputId}
            className={cn(
              'inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-1 rounded-xl bg-primary/10 px-3 text-xs font-semibold text-primary',
              (disabled || isProcessing) && 'pointer-events-none opacity-60'
            )}
          >
            {hasFiles ? <Plus className='size-3.5' /> : <ImagePlus className='size-3.5' />}
            {hasFiles ? 'Thêm' : 'Chọn ảnh'}
          </label>
        </div>

        {hasFiles ? (
          <div className='grid grid-cols-3 gap-2 sm:grid-cols-4'>
            {files.map((file, index) => (
              <ReceiptPreview
                key={`${file.name}-${file.size}-${file.lastModified}`}
                file={file}
                index={index}
                disabled={disabled || isProcessing}
                onRemove={() => onFilesChange(files.filter((_, fileIndex) => fileIndex !== index))}
              />
            ))}
          </div>
        ) : null}
      </div>

      <input
        id={inputId}
        type='file'
        multiple
        accept='image/jpeg,image/png,image/webp'
        className='sr-only'
        disabled={disabled || isProcessing}
        aria-label='Chọn nhiều ảnh hóa đơn để quét'
        onChange={(event) => {
          const selectedFiles = Array.from(event.target.files ?? [])
          const knownFiles = new Set(files.map((file) => `${file.name}-${file.size}-${file.lastModified}`))
          const newFiles = selectedFiles.filter(
            (file) => !knownFiles.has(`${file.name}-${file.size}-${file.lastModified}`)
          )
          onFilesChange([...files, ...newFiles])
          event.target.value = ''
        }}
      />

      {isProcessing ? (
        <div className='flex items-center gap-2 border-t border-primary/10 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary'>
          <Loader2 className='size-4 animate-spin' aria-hidden='true' />
          <span role='status'>
            {stageLabels[stage]}
            {progressLabel}
          </span>
        </div>
      ) : null}
    </Card>
  )
}
