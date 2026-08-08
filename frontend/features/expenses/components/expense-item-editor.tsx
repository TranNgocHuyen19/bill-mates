'use client'

import * as React from 'react'
import { Check, Loader2, Plus, UsersRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { RoomMember } from '@/features/rooms'
import { cn } from '@/lib/utils'
import type { SplitMethod } from '../api'

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

export function ExpenseItemEditor({
  members,
  defaultName = '',
  defaultAmount,
  isPending,
  onSave
}: ExpenseItemEditorProps) {
  const [method, setMethod] = React.useState<SplitMethod>('equal')
  const [selected, setSelected] = React.useState(() => members.map((member) => member.id))
  const [values, setValues] = React.useState<Record<string, string>>({})

  const selectedMembers = members.filter((member) => selected.includes(member.id))

  return (
    <Card className='rounded-3xl border-primary/15 p-4 sm:p-5'>
      <form
        className='space-y-5'
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          const name = String(form.get('name')).trim()
          const amount = Number(form.get('amount'))
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
        <div className='grid gap-3 sm:grid-cols-[1fr_180px]'>
          <Input name='name' label='Tên món' placeholder='Ví dụ: Gà rán' defaultValue={defaultName} required />
          <Input
            name='amount'
            type='number'
            min={1}
            step={1}
            inputMode='numeric'
            label='Thành tiền'
            defaultValue={defaultAmount || ''}
            trailingIcon={<span className='text-xs font-semibold'>₫</span>}
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
              className='text-xs font-semibold text-primary'
              onClick={() => setSelected(selected.length === members.length ? [] : members.map((member) => member.id))}
            >
              {selected.length === members.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>
          <div className='space-y-2'>
            {members.map((member) => {
              const isSelected = selected.includes(member.id)
              return (
                <div
                  key={member.id}
                  className={cn(
                    'flex min-h-14 items-center gap-3 rounded-xl border px-3 transition',
                    isSelected ? 'border-primary/30 bg-primary/5' : 'border-border opacity-60'
                  )}
                >
                  <button
                    type='button'
                    className={cn(
                      'grid size-6 shrink-0 place-items-center rounded-md border',
                      isSelected && 'border-primary bg-primary text-white'
                    )}
                    aria-label={`${isSelected ? 'Bỏ chọn' : 'Chọn'} ${member.display_name}`}
                    onClick={() =>
                      setSelected((current) =>
                        current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id]
                      )
                    }
                  >
                    {isSelected && <Check className='size-4' />}
                  </button>
                  <span className='min-w-0 flex-1 truncate text-sm font-semibold'>
                    {member.nickname || member.display_name}
                  </span>
                  {isSelected && method !== 'equal' && (
                    <div className='flex w-28 items-center gap-1'>
                      <input
                        className='h-9 w-full rounded-lg border bg-background px-2 text-right text-sm outline-none focus:border-primary'
                        type='number'
                        min={method === 'shares' ? 0.0001 : 0}
                        step={method === 'percentage' || method === 'shares' ? 0.01 : 1}
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
                      <span className='w-4 text-xs text-muted-foreground'>
                        {method === 'percentage' ? '%' : method === 'exact' ? '₫' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <Button className='h-12 w-full rounded-xl' disabled={isPending || selected.length === 0}>
          {isPending ? <Loader2 className='size-4 animate-spin' /> : <Plus className='size-4' />}
          {isPending ? 'Đang lưu món...' : 'Thêm món vào đơn nháp'}
        </Button>
      </form>
    </Card>
  )
}
