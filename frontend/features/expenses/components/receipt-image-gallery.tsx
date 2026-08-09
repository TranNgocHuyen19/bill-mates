'use client'

import * as React from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Image as ImageIcon, Loader2, RotateCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getExpenseReceiptImageApi, type ExpenseReceipt } from '../api'

interface ReceiptImageGalleryProps {
  receipts: ExpenseReceipt[]
}

export function ReceiptImageGallery({ receipts }: ReceiptImageGalleryProps) {
  const [activeReceiptId, setActiveReceiptId] = React.useState(receipts[0]?.id ?? '')
  const [images, setImages] = React.useState<Record<string, { url: string | null; error: boolean }>>({})
  const objectUrls = React.useRef(new Set<string>())
  const activeIndex = Math.max(
    0,
    receipts.findIndex((receipt) => receipt.id === activeReceiptId)
  )
  const activeReceipt = receipts[activeIndex] ?? receipts[0]
  const activeImage = activeReceipt ? images[activeReceipt.id] : undefined

  React.useEffect(() => {
    if (!activeReceipt || images[activeReceipt.id]) return
    let isActive = true
    void getExpenseReceiptImageApi(activeReceipt.id)
      .then((blob) => {
        if (!isActive) return
        const url = URL.createObjectURL(blob)
        objectUrls.current.add(url)
        setImages((current) => ({
          ...current,
          [activeReceipt.id]: { url, error: false }
        }))
      })
      .catch(() => {
        if (isActive) {
          setImages((current) => ({
            ...current,
            [activeReceipt.id]: { url: null, error: true }
          }))
        }
      })

    return () => {
      isActive = false
    }
  }, [activeReceipt, images])

  React.useEffect(() => {
    const urls = objectUrls.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  if (!activeReceipt) return null

  const moveToReceipt = (direction: -1 | 1) => {
    const nextIndex = (activeIndex + direction + receipts.length) % receipts.length
    setActiveReceiptId(receipts[nextIndex].id)
  }

  return (
    <Card className='overflow-hidden rounded-3xl border-border/80 p-0'>
      <div className='flex items-center gap-3 border-b bg-muted/25 px-4 py-3'>
        <span className='grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary'>
          <ImageIcon className='size-4.5' aria-hidden='true' />
        </span>
        <div className='min-w-0 flex-1'>
          <p className='text-sm font-bold'>Ảnh bill gốc để đối chiếu</p>
          <p className='truncate text-xs text-muted-foreground'>
            Ảnh {activeIndex + 1}/{receipts.length} · {activeReceipt.filename}
          </p>
        </div>
        <div className='flex shrink-0 items-center gap-1'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='size-9 rounded-xl'
            aria-label='Xem ảnh bill trước'
            onClick={() => moveToReceipt(-1)}
            disabled={receipts.length < 2}
          >
            <ChevronLeft className='size-4' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='size-9 rounded-xl'
            aria-label='Xem ảnh bill tiếp theo'
            onClick={() => moveToReceipt(1)}
            disabled={receipts.length < 2}
          >
            <ChevronRight className='size-4' />
          </Button>
        </div>
      </div>

      <div className='border-b bg-muted/10 px-3 pt-3'>
        <div className='flex gap-2 overflow-x-auto pb-3'>
          {receipts.map((receipt, index) => (
            <button
              key={receipt.id}
              type='button'
              className={`min-h-9 shrink-0 rounded-xl border px-3 text-xs font-semibold transition ${
                receipt.id === activeReceiptId
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground'
              }`}
              aria-label={`Xem ảnh bill ${index + 1}`}
              aria-pressed={receipt.id === activeReceiptId}
              onClick={() => setActiveReceiptId(receipt.id)}
            >
              Ảnh {index + 1}
            </button>
          ))}
        </div>
      </div>

      <div className='relative grid min-h-56 place-items-center bg-muted/60 p-3 sm:min-h-72'>
        {activeImage?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeImage.url}
            alt={`Ảnh bill gốc ${activeIndex + 1}`}
            className='max-h-[48vh] w-full rounded-xl object-contain shadow-sm sm:max-h-[60vh]'
          />
        ) : activeImage?.error ? (
          <div className='max-w-xs px-5 text-center' role='alert'>
            <AlertTriangle className='mx-auto size-6 text-tertiary' />
            <p className='mt-2 text-sm font-semibold'>Không tải được ảnh gốc</p>
            <Button
              type='button'
              variant='outline'
              className='mt-3 h-9 rounded-xl'
              onClick={() =>
                setImages((current) => {
                  const next = { ...current }
                  delete next[activeReceipt.id]
                  return next
                })
              }
            >
              <RotateCw className='size-3.5' />
              Thử lại
            </Button>
          </div>
        ) : (
          <div className='flex items-center gap-2 text-sm font-semibold text-muted-foreground' role='status'>
            <Loader2 className='size-4 animate-spin' />
            Đang tải ảnh gốc...
          </div>
        )}
      </div>
    </Card>
  )
}
