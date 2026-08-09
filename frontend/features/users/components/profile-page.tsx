'use client'

import * as React from 'react'
import {
  Building2,
  Check,
  ChevronDown,
  CreditCard,
  Loader2,
  LogOut,
  Moon,
  Pencil,
  Plus,
  UserRound,
  X
} from 'lucide-react'
import { useTheme } from 'next-themes'

import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useLogoutMutation } from '@/features/auth'
import {
  useCreatePaymentAccountMutation,
  useMyProfileQuery,
  usePaymentAccountsQuery,
  useUpdateMyProfileMutation
} from '../index'

export function ProfilePage() {
  const { resolvedTheme, setTheme } = useTheme()
  const profileQuery = useMyProfileQuery()
  const accountsQuery = usePaymentAccountsQuery()
  const updateProfile = useUpdateMyProfileMutation()
  const createAccount = useCreatePaymentAccountMutation()
  const logout = useLogoutMutation()
  const [editing, setEditing] = React.useState(false)
  const [addingAccount, setAddingAccount] = React.useState(false)

  if (profileQuery.isPending) {
    return (
      <div className='grid min-h-screen place-items-center bg-background'>
        <Loader2 className='size-7 animate-spin text-primary' aria-label='Đang tải hồ sơ' />
      </div>
    )
  }

  const profile = profileQuery.data

  return (
    <div className='min-h-screen bg-background pb-24 text-foreground'>
      <Navbar />
      <main className='mx-auto w-full max-w-3xl space-y-6 px-4 py-5 sm:py-8'>
        <header className='flex items-end justify-between gap-4'>
          <div>
            <p className='text-xs font-semibold tracking-[0.16em] text-primary uppercase'>Cá nhân</p>
            <h1 className='mt-1 text-2xl font-bold tracking-tight'>Hồ sơ & thanh toán</h1>
          </div>
          <Button variant='outline' size='sm' className='rounded-xl' onClick={() => setEditing((value) => !value)}>
            {editing ? <X className='size-4' /> : <Pencil className='size-4' />}
            {editing ? 'Đóng' : 'Chỉnh sửa'}
          </Button>
        </header>

        <Card className='overflow-hidden rounded-3xl border-primary/15 p-0'>
          <div className='bg-[linear-gradient(135deg,#24389c,#3f51b5_62%,#006c49)] p-5 text-white sm:p-7'>
            <div className='flex items-center gap-4'>
              <div className='grid size-16 shrink-0 place-items-center rounded-full border-2 border-white/50 bg-white/15 text-2xl font-bold'>
                {(profile?.display_name ?? 'B').charAt(0).toUpperCase()}
              </div>
              <div className='min-w-0'>
                <h2 className='truncate text-xl font-bold'>{profile?.display_name}</h2>
                <p className='truncate text-sm text-white/75'>{profile?.email}</p>
                <span className='mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs'>
                  <Check className='size-3.5' />
                  Đã xác thực
                </span>
              </div>
            </div>
          </div>

          {editing && (
            <form
              className='grid gap-4 p-5 sm:grid-cols-2'
              onSubmit={(event) => {
                event.preventDefault()
                const form = new FormData(event.currentTarget)
                const displayName = String(form.get('display_name')).trim()
                const phone = String(form.get('phone')).trim()
                updateProfile.mutate(
                  { display_name: displayName, phone: phone || null },
                  { onSuccess: () => setEditing(false) }
                )
              }}
            >
              <Input
                name='display_name'
                label='Tên hiển thị'
                defaultValue={profile?.display_name}
                icon={<UserRound className='size-4' />}
                minLength={2}
                required
              />
              <Input
                name='phone'
                label='Số điện thoại'
                defaultValue={profile?.phone ?? ''}
                placeholder='09xx xxx xxx'
              />
              <Button className='h-11 rounded-xl sm:col-span-2' disabled={updateProfile.isPending}>
                {updateProfile.isPending && <Loader2 className='size-4 animate-spin' />}
                Lưu thay đổi
              </Button>
            </form>
          )}
        </Card>

        <section className='space-y-3'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='font-bold'>Tài khoản nhận tiền</h2>
              <p className='text-xs text-muted-foreground'>Dùng để tạo QR khi bạn cần được hoàn tiền.</p>
            </div>
            <Button size='sm' className='rounded-xl' onClick={() => setAddingAccount((value) => !value)}>
              {addingAccount ? <X className='size-4' /> : <Plus className='size-4' />}
              {addingAccount ? 'Đóng' : 'Thêm'}
            </Button>
          </div>

          {addingAccount && (
            <Card className='rounded-2xl p-4 sm:p-5'>
              <form
                className='grid gap-4 sm:grid-cols-2'
                onSubmit={(event) => {
                  event.preventDefault()
                  const form = new FormData(event.currentTarget)
                  createAccount.mutate(
                    {
                      label: String(form.get('label')),
                      method: 'bank_transfer',
                      bank_name: String(form.get('bank_name')),
                      bank_code: String(form.get('bank_code')),
                      account_number: String(form.get('account_number')),
                      account_name: String(form.get('account_name')),
                      is_default: true
                    },
                    { onSuccess: () => setAddingAccount(false) }
                  )
                }}
              >
                <Input name='label' label='Tên gợi nhớ' placeholder='Tài khoản chính' required />
                <Input name='bank_name' label='Ngân hàng' placeholder='MB Bank' required />
                <Input name='bank_code' label='Mã ngân hàng' placeholder='MB' />
                <Input name='account_number' label='Số tài khoản' inputMode='numeric' required />
                <Input name='account_name' label='Tên chủ tài khoản' className='uppercase sm:col-span-2' required />
                <Button className='h-11 rounded-xl sm:col-span-2' disabled={createAccount.isPending}>
                  {createAccount.isPending && <Loader2 className='size-4 animate-spin' />}
                  Lưu tài khoản
                </Button>
              </form>
            </Card>
          )}

          {accountsQuery.isPending ? (
            <Card className='flex h-24 items-center justify-center rounded-2xl'>
              <Loader2 className='size-5 animate-spin text-primary' />
            </Card>
          ) : accountsQuery.data?.length ? (
            <div className='space-y-3'>
              {accountsQuery.data.map((account) => (
                <Card key={account.id} className='flex items-center gap-3 rounded-2xl p-4'>
                  <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary'>
                    <Building2 className='size-5' />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <p className='truncate text-sm font-bold'>{account.label}</p>
                      {account.is_default && (
                        <span className='rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-secondary'>
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className='truncate text-xs text-muted-foreground'>
                      {account.bank_name} • {account.account_number}
                    </p>
                    <p className='truncate text-xs font-medium'>{account.account_name}</p>
                  </div>
                  <CreditCard className='text-outline size-5' />
                </Card>
              ))}
            </div>
          ) : (
            <Card className='rounded-2xl border-dashed p-6 text-center'>
              <CreditCard className='text-outline mx-auto size-7' />
              <p className='mt-2 text-sm font-semibold'>Chưa có tài khoản nhận tiền</p>
            </Card>
          )}
        </section>

        <section className='space-y-3'>
          <h2 className='font-bold'>Cài đặt ứng dụng</h2>
          <Card className='overflow-hidden rounded-2xl p-0'>
            <button
              className='flex min-h-14 w-full items-center gap-3 px-4 text-left hover:bg-muted'
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              <Moon className='size-5 text-primary' />
              <span className='flex-1 text-sm font-semibold'>Giao diện sáng / tối</span>
              <span className='text-xs text-muted-foreground'>{resolvedTheme === 'dark' ? 'Tối' : 'Sáng'}</span>
              <ChevronDown className='text-outline size-4 -rotate-90' />
            </button>
          </Card>
        </section>

        <Button
          variant='destructive'
          className='h-12 w-full rounded-2xl'
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut className='size-4' />
          Đăng xuất
        </Button>
      </main>
    </div>
  )
}
