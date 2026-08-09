'use client'

import * as React from 'react'
import { AlertCircle, Check, Loader2, Plus, UsersRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { RoomMember } from '@/features/rooms'
import { formatVnd } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { SplitMethod } from '../api'
import { MoneyInput } from './money-input'

interface ExpenseItemEditorProps {
  members: RoomMember[]
  defaultName?: string
  defaultAmount?: number
  isPending: boolean
  onSave: (data: {
    name: string
    amount: number
    method: SplitMethod
    participants: Array<{ member_id: string; share_value?: number | null }>
  }) => void
}

const methods: Array<{ value: SplitMethod; label: string; hint: string }> = [
  { value: 'equal', label: 'Chia đều', hint: 'Mỗi người một phần bằng nhau' },
  { value: 'exact', label: 'Số tiền', hint: 'Nhập số tiền từng người' },
  { value: 'percentage', label: 'Phần trăm', hint: 'Tổng tỷ lệ phải bằng 100%' },
  { value: 'shares', label: 'Trọng số', hint: 'Ví dụ 1 / 1 / 2 phần' }
]

function allocateByWeights(total: number, weights: number[]): number[] {
  const normalizedTotal = Math.max(0, Math.round(total))
  const weightTotal = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0)
  if (!weightTotal) return weights.map(() => 0)

  const allocations = weights.map((weight) => Math.floor((normalizedTotal * Math.max(0, weight)) / weightTotal))
  let remainder = normalizedTotal - allocations.reduce((sum, amount) => sum + amount, 0)

  for (let index = 0; remainder > 0; index = (index + 1) % allocations.length) {
    allocations[index] += 1
    remainder -= 1
  }

  return allocations
}

export function ExpenseItemEditor({
  members,
  defaultName = '',
  defaultAmount,
  isPending,
  onSave
}: ExpenseItemEditorProps) {
  const [amount, setAmount] = React.useState(defaultAmount ?? 0)
  const [method, setMethod] = React.useState<SplitMethod>('equal')
  const [selected, setSelected] = React.useState(() => members.map((member) => member.id))
  const [values, setValues] = React.useState<Record<string, string>>({})

  const selectedMembers = members.filter((member) => selected.includes(member.id))
  const numericValues = selectedMembers.map((member) => {
    const numericValue = Number(values[member.id] || 0)
    return Number.isFinite(numericValue) ? numericValue : 0
  })
  const enteredTotal = numericValues.reduce((sum, current) => sum + current, 0)
  const previewAmounts =
    method === 'equal'
      ? allocateByWeights(
          amount,
          selectedMembers.map(() => 1)
        )
      : method === 'exact'
        ? numericValues
        : method === 'percentage'
          ? numericValues.map((percentage) => Math.round((amount * percentage) / 100))
          : allocateByWeights(amount, numericValues)

  const previewByMember = new Map(selectedMembers.map((member, index) => [member.id, previewAmounts[index] ?? 0]))
  const percentageTotal = method === 'percentage' ? enteredTotal : 0
  const hasInvalidShares = method === 'shares' && numericValues.some((value) => value <= 0)
  const splitIssue =
    selectedMembers.length === 0
      ? 'Chọn ít nhất một người sử dụng món.'
      : amount <= 0
        ? 'Thành tiền phải lớn hơn 0 ₫.'
        : method === 'exact' && enteredTotal !== amount
          ? `${enteredTotal < amount ? 'Còn thiếu' : 'Đang vượt'} ${formatVnd(Math.abs(amount - enteredTotal))}.`
          : method === 'percentage' && Math.abs(percentageTotal - 100) > 0.001
            ? `Tổng phần trăm hiện là ${percentageTotal}%, cần đúng 100%.`
            : hasInvalidShares
              ? 'Trọng số của mỗi người phải lớn hơn 0.'
              : null

  return (
    <Card className='rounded-3xl border-primary/15 p-4 sm:p-5'>
      <form
        className='space-y-5'
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          const name = String(form.get('name')).trim()
          if (splitIssue) return

          onSave({
            name,
            amount,
            method,
            participants: selectedMembers.map((member) => ({
              member_id: member.id,
              share_value: method === 'equal' ? null : Number(values[member.id] || 0)
            }))
          })
        }}
      >
        <div className='grid gap-3 sm:grid-cols-[1fr_220px]'>
          <Input name='name' label='Tên món' placeholder='Ví dụ: Gà rán' defaultValue={defaultName} required />
          <MoneyInput
            name='amount'
            label='Thành tiền'
            value={amount}
            onValueChange={setAmount}
            quickAmounts={[10_000, 20_000, 50_000, 100_000]}
            showHint={false}
            required
          />
        </div>

        <div>
          <p className='mb-2 text-xs font-semibold text-muted-foreground'>Cách chia món</p>
          <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
            {methods.map((option) => (
              <button
                key={option.value}
                type='button'
                className={cn(
                  'min-h-14 rounded-xl border p-2 text-left transition',
                  method === option.value
                    ? 'border-primary bg-primary/8 text-primary'
                    : 'border-outline-variant/50 bg-card hover:border-primary/40'
                )}
                onClick={() => setMethod(option.value)}
                title={option.hint}
              >
                <span className='block text-xs font-bold'>{option.label}</span>
                <span className='mt-0.5 block text-[10px] leading-4 text-muted-foreground'>{option.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className='mb-2 flex items-center justify-between'>
            <p className='flex items-center gap-1.5 text-xs font-semibold text-muted-foreground'>
              <UsersRound className='size-4 text-primary' />
              Người sử dụng món ({selected.length})
            </p>
            <button
              type='button'
              className='min-h-11 px-2 text-xs font-semibold text-primary'
              onClick={() => setSelected(selected.length === members.length ? [] : members.map((member) => member.id))}
            >
              {selected.length === members.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>
          <div className='space-y-2'>
            {members.map((member) => {
              const isSelected = selected.includes(member.id)
              const memberName = member.nickname || member.display_name
              const previewAmount = previewByMember.get(member.id) ?? 0

              return (
                <div
                  key={member.id}
                  className={cn(
                    'flex min-h-16 items-center gap-3 rounded-xl border px-3 py-2 transition',
                    isSelected ? 'border-primary/30 bg-primary/5' : 'border-border opacity-60'
                  )}
                >
                  <button
                    type='button'
                    className={cn(
                      'grid size-7 shrink-0 place-items-center rounded-md border',
                      isSelected && 'border-primary bg-primary text-white'
                    )}
                    aria-label={`${isSelected ? 'Bỏ chọn' : 'Chọn'} ${member.display_name}`}
                    onClick={() =>
                      setSelected((current) =>
                        current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id]
                      )
                    }
                  >
                    {isSelected ? <Check className='size-4' /> : null}
                  </button>

                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-semibold'>{memberName}</p>
                    {isSelected ? (
                      <p className='mt-0.5 text-[11px] text-muted-foreground'>
                        Dự kiến chịu <strong className='text-foreground'>{formatVnd(previewAmount)}</strong>
                      </p>
                    ) : null}
                  </div>

                  {isSelected && method === 'exact' ? (
                    <MoneyInput
                      value={Number(values[member.id] || 0)}
                      onValueChange={(nextValue) =>
                        setValues((current) => ({
                          ...current,
                          [member.id]: String(nextValue || '')
                        }))
                      }
                      quickAmounts={false}
                      showHint={false}
                      ariaLabel={`Số tiền của ${member.display_name}`}
                      className='w-32 shrink-0'
                      inputClassName='h-10 px-2 pr-8 text-right text-sm'
                    />
                  ) : null}

                  {isSelected && (method === 'percentage' || method === 'shares') ? (
                    <div className='flex w-24 shrink-0 items-center gap-1'>
                      <input
                        className='h-10 w-full rounded-lg border bg-background px-2 text-right text-sm outline-none focus:border-primary'
                        type='number'
                        min={method === 'shares' ? 0.01 : 0}
                        step='0.01'
                        inputMode='decimal'
                        value={values[member.id] ?? ''}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            [member.id]: event.target.value
                          }))
                        }
                        aria-label={`${methods.find((item) => item.value === method)?.label} của ${member.display_name}`}
                        required
                      />
                      <span className='w-4 text-xs text-muted-foreground'>{method === 'percentage' ? '%' : ''}</span>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        {splitIssue ? (
          <div className='flex items-start gap-2 rounded-xl border border-tertiary/20 bg-tertiary/5 p-3 text-xs text-tertiary'>
            <AlertCircle className='mt-0.5 size-4 shrink-0' />
            <span>{splitIssue}</span>
          </div>
        ) : (
          <div className='flex items-center justify-between rounded-xl bg-secondary/5 px-3 py-2 text-xs'>
            <span className='font-semibold text-secondary'>Phần chia đã khớp</span>
            <span className='font-bold'>{formatVnd(amount)}</span>
          </div>
        )}

        <Button className='h-12 w-full rounded-xl' disabled={isPending || Boolean(splitIssue)}>
          {isPending ? <Loader2 className='size-4 animate-spin' /> : <Plus className='size-4' />}
          {isPending ? 'Đang lưu món...' : 'Thêm món vào đơn nháp'}
        </Button>
      </form>
    </Card>
  )
}
