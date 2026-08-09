'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

const moneyNumberFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0
})

const defaultQuickAmounts = [10_000, 50_000, 100_000, 500_000] as const
const defaultMaxAmount = 999_999_999_999

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
  quickAmounts?: readonly number[] | false
  showHint?: boolean
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
  quickAmounts = defaultQuickAmounts,
  showHint = true,
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
  const hintId = `${inputId}-hint`
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
          aria-describedby={showHint ? hintId : undefined}
          className={cn(
            'h-12 w-full rounded-xl border border-input bg-background px-3 pr-11 text-base font-semibold tabular-nums shadow-sm transition-all placeholder:font-normal placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
            inputClassName
          )}
          onChange={(event) => updateValue(normalizeMoneyValue(event.target.value, max))}
        />
        <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-bold text-muted-foreground'>
          ₫
        </span>
        {name ? <input type='hidden' name={name} value={moneyValue || ''} disabled={disabled} /> : null}
      </div>

      {showHint ? (
        <p id={hintId} className='text-[11px] leading-4 text-muted-foreground'>
          Nhập số, hệ thống tự thêm dấu phân cách.
        </p>
      ) : null}

      {quickAmounts && quickAmounts.length > 0 ? (
        <div className='flex flex-wrap gap-2' aria-label='Nhập nhanh số tiền'>
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              type='button'
              disabled={disabled}
              className='min-h-11 rounded-xl border border-primary/15 bg-primary/5 px-3 text-xs font-bold text-primary transition-colors hover:border-primary/35 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50'
              aria-label={`Cộng ${moneyNumberFormatter.format(amount)} đồng`}
              onClick={() => updateValue(moneyValue + amount)}
            >
              +{amount >= 1_000_000 ? `${amount / 1_000_000} triệu` : `${amount / 1_000}K`}
            </button>
          ))}
          {moneyValue > 0 ? (
            <button
              type='button'
              disabled={disabled}
              className='min-h-11 rounded-xl px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
              onClick={() => updateValue(0)}
            >
              Xóa số
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
