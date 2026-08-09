'use client'

import * as React from 'react'
import { AlertTriangle, Check, FileSearch, Loader2, RefreshCw, ScanLine, Sparkles, WandSparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatVnd } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { ExpenseReceipt, OcrItemSuggestion } from '../api'
import { MoneyInput } from './money-input'

interface EditableSuggestion extends OcrItemSuggestion {
  sourceIndex: number
}

interface OcrReceiptReviewProps {
  receipts: ExpenseReceipt[]
  expenseTotal: number
  selectedIndex: number | null
  importedIndexes: number[]
  isRetrying: boolean
  onRetry: () => void
  onUseSuggestion: (suggestion: EditableSuggestion) => void
}

function normalizeSuggestionName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function buildSuggestions(receipts: ExpenseReceipt[]): EditableSuggestion[] {
  const suggestions: EditableSuggestion[] = []
  const seen = new Set<string>()

  receipts.forEach((receipt) => {
    receipt.ocr_data?.items?.forEach((item) => {
      const key = `${normalizeSuggestionName(item.name)}:${item.total_amount}`
      if (seen.has(key)) return
      seen.add(key)
      suggestions.push({ ...item, sourceIndex: suggestions.length })
    })
  })

  return suggestions
}

export function OcrReceiptReview({
  receipts,
  expenseTotal,
  selectedIndex,
  importedIndexes,
  isRetrying,
  onRetry,
  onUseSuggestion
}: OcrReceiptReviewProps) {
  const [suggestions, setSuggestions] = React.useState(() => buildSuggestions(receipts))
  const completedReceipts = receipts.filter((receipt) => receipt.ocr_status === 'completed')
  const failedReceipts = receipts.filter((receipt) => receipt.ocr_status === 'failed')
  const hasPendingReceipts = receipts.some((receipt) =>
    ['not_requested', 'pending', 'processing'].includes(receipt.ocr_status)
  )
  const detectedTotal =
    completedReceipts.find((receipt) => receipt.ocr_data?.total_amount != null)?.ocr_data?.total_amount ?? null
  const merchant = completedReceipts.find((receipt) => receipt.ocr_data?.merchant)?.ocr_data?.merchant
  const rawText = completedReceipts
    .map((receipt) => `[${receipt.filename}]\n${receipt.ocr_data?.raw_text ?? ''}`)
    .join('\n\n')
  const confidence =
    completedReceipts.length > 0
      ? Math.round(
          (completedReceipts.reduce((sum, receipt) => sum + (receipt.ocr_data?.average_confidence ?? 0), 0) /
            completedReceipts.length) *
            100
        )
      : 0
  const hasTotalMismatch = detectedTotal !== null && detectedTotal !== expenseTotal

  if (hasPendingReceipts && completedReceipts.length === 0) {
    return (
      <Card className='flex items-center gap-3 rounded-2xl border-primary/20 bg-primary/5 p-4'>
        <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary'>
          <Loader2 className='size-5 animate-spin' aria-hidden='true' />
        </span>
        <div role='status'>
          <p className='text-sm font-bold'>PaddleOCR đang đọc bill</p>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            Đang xử lý {receipts.length} ảnh. Lần quét đầu có thể lâu hơn vì cần tải model tiếng Việt.
          </p>
        </div>
      </Card>
    )
  }

  if (failedReceipts.length > 0 && completedReceipts.length === 0) {
    return (
      <Card className='rounded-2xl border-destructive/25 bg-destructive/5 p-4' role='alert'>
        <div className='flex items-start gap-3'>
          <AlertTriangle className='mt-0.5 size-5 shrink-0 text-destructive' />
          <div className='min-w-0 flex-1'>
            <p className='text-sm font-bold'>Chưa đọc được hóa đơn</p>
            <p className='mt-1 text-xs leading-5 text-muted-foreground'>
              {failedReceipts[0].ocr_data?.error?.message ?? 'Hãy thử ảnh rõ hơn, đủ sáng và không bị nghiêng.'}
            </p>
          </div>
        </div>
        <Button
          type='button'
          variant='outline'
          className='mt-3 h-10 w-full rounded-xl'
          disabled={isRetrying}
          onClick={onRetry}
        >
          {isRetrying ? <Loader2 className='size-4 animate-spin' /> : <RefreshCw className='size-4' />}
          {isRetrying ? 'Đang quét lại...' : 'Quét lại bill'}
        </Button>
      </Card>
    )
  }

  return (
    <Card className='overflow-hidden rounded-3xl border-primary/20 p-0'>
      <div className='relative overflow-hidden bg-[linear-gradient(115deg,hsl(var(--primary)/0.14),hsl(var(--secondary)/0.07),transparent)] p-4'>
        <ScanLine className='absolute -top-4 -right-4 size-24 text-primary/[0.06]' aria-hidden='true' />
        <div className='relative flex items-start gap-3'>
          <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm'>
            <WandSparkles className='size-5' aria-hidden='true' />
          </span>
          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <p className='text-sm font-bold'>
                PaddleOCR tìm thấy {suggestions.length} món từ {receipts.length} ảnh
              </p>
              <span className='rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-bold text-muted-foreground'>
                Tin cậy {confidence}%
              </span>
            </div>
            <p className='mt-0.5 truncate text-xs text-muted-foreground'>{merchant || receipts[0]?.filename}</p>
          </div>
          <Sparkles className='size-4 shrink-0 text-amber-500' aria-hidden='true' />
        </div>

        <div className='relative mt-3 grid grid-cols-2 gap-2'>
          <div className='rounded-xl bg-background/75 px-3 py-2 backdrop-blur'>
            <p className='text-[10px] font-semibold text-muted-foreground uppercase'>OCR đọc được</p>
            <p className='mt-0.5 truncate text-sm font-bold tabular-nums'>
              {detectedTotal === null ? 'Chưa rõ' : formatVnd(detectedTotal)}
            </p>
          </div>
          <div className='rounded-xl bg-background/75 px-3 py-2 backdrop-blur'>
            <p className='text-[10px] font-semibold text-muted-foreground uppercase'>Tổng đơn nháp</p>
            <p className='mt-0.5 truncate text-sm font-bold tabular-nums'>{formatVnd(expenseTotal)}</p>
          </div>
        </div>
      </div>

      {hasTotalMismatch ? (
        <div className='flex items-start gap-2 border-y border-tertiary/15 bg-tertiary/5 px-4 py-2.5 text-xs text-tertiary'>
          <AlertTriangle className='mt-0.5 size-4 shrink-0' />
          <span>Hai tổng tiền chưa khớp. Hãy kiểm tra lại ảnh hoặc số tiền đơn nháp.</span>
        </div>
      ) : null}

      {failedReceipts.length > 0 ? (
        <div className='flex items-start gap-2 border-b border-tertiary/15 bg-tertiary/5 px-4 py-2.5 text-xs text-tertiary'>
          <AlertTriangle className='mt-0.5 size-4 shrink-0' />
          <span>{failedReceipts.length} ảnh chưa đọc được; các món từ ảnh còn lại vẫn có thể dùng.</span>
        </div>
      ) : null}

      <div className='space-y-3 p-4'>
        <div>
          <p className='text-sm font-bold'>Kiểm tra từng món</p>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            Các dòng trùng giữa nhiều ảnh đã được gộp. Sửa nếu cần, rồi đưa từng món xuống phần chia người.
          </p>
        </div>

        {suggestions.length ? (
          <div className='space-y-2.5'>
            {suggestions.map((suggestion, index) => {
              const isSelected = selectedIndex === suggestion.sourceIndex
              const isImported = importedIndexes.includes(suggestion.sourceIndex)
              return (
                <div
                  key={suggestion.sourceIndex}
                  className={cn(
                    'rounded-2xl border p-3 transition-colors',
                    isSelected ? 'border-secondary/40 bg-secondary/5' : 'border-border bg-muted/20'
                  )}
                >
                  <div className='grid gap-2 min-[460px]:grid-cols-[1fr_150px]'>
                    <Input
                      value={suggestion.name}
                      aria-label={`Tên món OCR ${index + 1}`}
                      className='h-10 bg-background text-sm font-semibold'
                      onChange={(event) =>
                        setSuggestions((current) =>
                          current.map((item) =>
                            item.sourceIndex === suggestion.sourceIndex ? { ...item, name: event.target.value } : item
                          )
                        )
                      }
                    />
                    <MoneyInput
                      value={suggestion.total_amount}
                      onValueChange={(totalAmount) =>
                        setSuggestions((current) =>
                          current.map((item) =>
                            item.sourceIndex === suggestion.sourceIndex ? { ...item, total_amount: totalAmount } : item
                          )
                        )
                      }
                      quickZeroCounts={false}
                      ariaLabel={`Thành tiền món OCR ${index + 1}`}
                      inputClassName='h-10 bg-background px-2 pr-20 text-sm'
                    />
                  </div>
                  <div className='mt-2 flex items-center justify-between gap-2'>
                    <span className='truncate text-[11px] text-muted-foreground'>
                      {suggestion.quantity !== 1
                        ? `${suggestion.quantity} × ${formatVnd(suggestion.unit_price)}`
                        : `Tin cậy ${Math.round(suggestion.confidence * 100)}%`}
                    </span>
                    <Button
                      type='button'
                      size='sm'
                      variant={isSelected || isImported ? 'secondary' : 'outline'}
                      className='h-9 shrink-0 rounded-xl'
                      disabled={isImported || !suggestion.name.trim() || suggestion.total_amount <= 0}
                      aria-pressed={isSelected}
                      onClick={() => onUseSuggestion(suggestion)}
                    >
                      {isSelected || isImported ? <Check className='size-3.5' /> : <FileSearch className='size-3.5' />}
                      {isImported ? 'Đã thêm' : isSelected ? 'Đang chia' : 'Chia món này'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className='rounded-2xl bg-muted/50 p-4 text-center'>
            <FileSearch className='mx-auto size-6 text-muted-foreground' />
            <p className='mt-2 text-sm font-semibold'>Đã đọc được chữ nhưng chưa tách được món</p>
            <p className='mt-1 text-xs text-muted-foreground'>Bạn vẫn có thể nhập món thủ công ở phần bên dưới.</p>
          </div>
        )}

        {rawText ? (
          <details className='rounded-xl border border-border/70 bg-background px-3 py-2 text-xs'>
            <summary className='min-h-8 cursor-pointer py-1 font-semibold text-muted-foreground'>
              Xem chữ OCR thô
            </summary>
            <pre className='max-h-40 overflow-auto py-2 font-sans leading-5 break-words whitespace-pre-wrap text-foreground'>
              {rawText}
            </pre>
          </details>
        ) : null}

        <Button
          type='button'
          variant='ghost'
          className='h-10 w-full rounded-xl text-xs text-muted-foreground'
          disabled={isRetrying}
          onClick={onRetry}
        >
          {isRetrying ? <Loader2 className='size-4 animate-spin' /> : <RefreshCw className='size-4' />}
          Quét lại tất cả ảnh gốc
        </Button>
      </div>
    </Card>
  )
}
