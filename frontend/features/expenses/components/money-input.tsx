'use client'

import * as React from 'react'
import { Delete } from 'lucide-react'

import { cn } from '@/lib/utils'

const moneyNumberFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0
})

const defaultQuickZeroCounts = [3, 4, 5, 6] as const
const defaultMaxAmount = 999_999_999_999

function formatQuickZeros(zeroCount: number): string {
  const groupedZeros = '0'.repeat(zeroCount).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return zeroCount === 3 ? `.${groupedZeros}` : groupedZeros
}

function normalizeMoneyValue(value: number | string | undefined, max: number): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.min(Math.max(Math.trunc(value), 0), max) : 0
  }

  const digits = value?.replace(/\D/g, '') ?? ''
  if (!digits) return 0

  const parsed = Number(digits)
  return Number.isFinite(parsed) ? Math.min(parsed, max) : 0
}

interface MoneyInputProps {
  name?: string
  label?: React.ReactNode
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  quickZeroCounts?: readonly number[] | false
  required?: boolean
  disabled?: boolean
  max?: number
  id?: string
  placeholder?: string
  autoFocus?: boolean
  className?: string
  inputClassName?: string
  ariaLabel?: string
}

export function MoneyInput({
  name,
  label,
  value,
  defaultValue = 0,
  onValueChange,
  quickZeroCounts = defaultQuickZeroCounts,
  required = false,
  disabled = false,
  max = defaultMaxAmount,
  id,
  placeholder = '0',
  autoFocus,
  className,
  inputClassName,
  ariaLabel
}: MoneyInputProps) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = React.useState(() => normalizeMoneyValue(defaultValue, max))
  const moneyValue = isControlled ? normalizeMoneyValue(value, max) : internalValue

  const updateValue = (nextValue: number) => {
    const normalizedValue = normalizeMoneyValue(nextValue, max)
    if (!isControlled) setInternalValue(normalizedValue)
    onValueChange?.(normalizedValue)
  }

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {label ? (
        <label className='block text-xs font-semibold text-muted-foreground' htmlFor={inputId}>
          {label}
        </label>
      ) : null}

      <div className='relative'>
        <input
          id={inputId}
          type='text'
          inputMode='numeric'
          autoComplete='off'
          value={moneyValue ? moneyNumberFormatter.format(moneyValue) : ''}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-label={ariaLabel}
          className={cn(
            'h-12 w-full rounded-xl border border-input bg-background px-3 pr-24 text-base font-semibold tabular-nums shadow-sm transition-all placeholder:font-normal placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
            inputClassName
          )}
          onChange={(event) => updateValue(normalizeMoneyValue(event.target.value, max))}
        />
        <button
          type='button'
          disabled={disabled || moneyValue === 0}
          className='absolute top-1/2 right-8 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30'
          aria-label='Xóa một chữ số'
          title='Xóa một chữ số'
          onClick={() => updateValue(Math.floor(moneyValue / 10))}
        >
          <Delete className='size-4' aria-hidden='true' />
        </button>
        <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-bold text-muted-foreground'>
          ₫
        </span>
        {name ? <input type='hidden' name={name} value={moneyValue || ''} disabled={disabled} /> : null}
      </div>

      {quickZeroCounts && quickZeroCounts.length > 0 ? (
        <div className='grid grid-cols-4 gap-2' aria-label='Thêm nhanh số 0'>
          {quickZeroCounts.map((zeroCount) => (
            <button
              key={zeroCount}
              type='button'
              disabled={disabled || moneyValue === 0}
              className='min-h-11 rounded-xl border border-primary/15 bg-primary/5 px-2 text-xs font-bold tracking-wide text-primary transition-colors hover:border-primary/35 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40'
              aria-label={`Thêm ${zeroCount} số 0`}
              onClick={() => updateValue(moneyValue * 10 ** zeroCount)}
            >
              {formatQuickZeros(zeroCount)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
