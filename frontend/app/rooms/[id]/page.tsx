'use client'

import * as React from 'react'
import {
  ArrowLeft,
  ChevronRight,
  Crown,
  FolderPlus,
  Loader2,
  Plus,
  ReceiptText,
  RefreshCw,
  Share2,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { Navbar } from '@/components/navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PATHS } from '@/constants'
import { useExpensesQuery } from '@/features/expenses'
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useCreateInviteMutation,
  useRemoveMemberMutation,
  useRoomDetailQuery,
  useUpdateMemberRoleMutation,
  type RoomRole
} from '@/features/rooms'
import { formatVnd } from '@/lib/money'
import { showSuccessToast } from '@/lib/toast'

const roleLabels: Record<RoomRole, string> = {
  owner: 'Chủ phòng',
  admin: 'Quản trị',
  member: 'Thành viên'
}

export default function RoomDetailPage() {
  const params = useParams<{ id: string }>()
  const roomId = params.id
  const roomQuery = useRoomDetailQuery(roomId)
  const expensesQuery = useExpensesQuery(roomId)
  const categoriesQuery = useCategoriesQuery(roomId)
  const createInvite = useCreateInviteMutation(roomId)
  const createCategory = useCreateCategoryMutation(roomId)
  const updateRole = useUpdateMemberRoleMutation(roomId)
  const removeMember = useRemoveMemberMutation(roomId)
  const [showCategoryForm, setShowCategoryForm] = React.useState(false)
  const room = roomQuery.data
  const canManage = room?.role === 'owner' || room?.role === 'admin'

  const shareInvite = () => {
    createInvite.mutate(undefined, {
      onSuccess: async (invite) => {
        const link = `${window.location.origin}/rooms/join/${invite.token}`
        await navigator.clipboard.writeText(link)
        showSuccessToast('Đã sao chép liên kết mời dùng trong 72 giờ.')
      }
    })
  }

  if (roomQuery.isPending) {
    return (
      <div className='grid min-h-screen place-items-center bg-background'>
        <Loader2 className='size-7 animate-spin text-primary' aria-label='Đang tải phòng' />
      </div>
    )
  }

  if (!room) {
    return (
      <div className='grid min-h-screen place-items-center bg-background px-4'>
        <Card className='max-w-md rounded-2xl p-7 text-center'>
          <p className='font-bold'>Không mở được phòng này</p>
          <p className='mt-1 text-sm text-muted-foreground'>Phòng không tồn tại hoặc bạn không còn quyền truy cập.</p>
          <Button className='mt-4 rounded-xl' onClick={() => roomQuery.refetch()}>
            <RefreshCw className='size-4' />
            Thử lại
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background pb-24 text-foreground'>
      <Navbar />
      <main className='mx-auto w-full max-w-5xl space-y-6 px-4 py-5 sm:px-6 sm:py-8'>
        <Link
          href={PATHS.ROOMS}
          className='inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary'
        >
          <ArrowLeft className='size-4' />
          Tất cả phòng
        </Link>

        <section className='relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#24389c,#3f51b5_68%,#006c49)] p-5 text-white shadow-xl shadow-primary/15 sm:p-7'>
          <div className='absolute -top-16 -right-14 size-44 rounded-full border-[28px] border-white/5' />
          <div className='relative flex items-start justify-between gap-4'>
            <div className='min-w-0'>
              <Badge className='border-white/20 bg-white/15 text-white hover:bg-white/15'>
                {roleLabels[room.role]}
              </Badge>
              <h1 className='mt-3 truncate text-2xl font-bold sm:text-3xl'>{room.name}</h1>
              <p className='mt-1 max-w-xl text-sm leading-6 text-white/70'>
                {room.description || 'Sổ chi phí chung của mọi thành viên trong phòng.'}
              </p>
            </div>
            {canManage && (
              <Button
                variant='secondary'
                size='sm'
                className='relative h-11 shrink-0 rounded-xl'
                onClick={shareInvite}
                disabled={createInvite.isPending}
              >
                {createInvite.isPending ? <Loader2 className='size-4 animate-spin' /> : <Share2 className='size-4' />}
                <span className='hidden sm:inline'>Mời thành viên</span>
                <span className='sm:hidden'>Mời</span>
              </Button>
            )}
          </div>
          <div className='relative mt-6 grid grid-cols-2 gap-3'>
            <div className='rounded-2xl bg-white/10 p-3 backdrop-blur'>
              <p className='text-xs text-white/65'>Tổng chi đã chốt</p>
              <p className='mt-1 text-xl font-bold'>{formatVnd(room.total_expenses)}</p>
            </div>
            <div className='rounded-2xl bg-white/10 p-3 backdrop-blur'>
              <p className='text-xs text-white/65'>Thành viên hoạt động</p>
              <p className='mt-1 text-xl font-bold'>{room.member_count}</p>
            </div>
          </div>
        </section>

        <div className='grid gap-6 lg:grid-cols-[1.45fr_0.95fr]'>
          <section className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='font-bold'>Khoản chi gần đây</h2>
                <p className='text-xs text-muted-foreground'>Đơn nháp sẽ không được cộng vào tổng chi.</p>
              </div>
              <Button asChild size='sm' className='rounded-xl'>
                <Link href={`${PATHS.EXPENSES.NEW}?roomId=${room.id}`}>
                  <Plus className='size-4' />
                  Thêm khoản chi
                </Link>
              </Button>
            </div>
            {expensesQuery.isPending ? (
              <Card className='h-28 animate-pulse rounded-2xl bg-muted' />
            ) : expensesQuery.data?.length ? (
              <div className='space-y-2'>
                {expensesQuery.data.slice(0, 5).map((expense) => (
                  <Card key={expense.id} className='flex items-center gap-3 rounded-2xl p-4'>
                    <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary'>
                      <ReceiptText className='size-5' />
                    </span>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-bold'>{expense.title}</p>
                      <p className='mt-0.5 text-xs text-muted-foreground'>
                        {expense.status === 'draft' ? 'Đơn nháp' : expense.status === 'posted' ? 'Đã chốt' : 'Đã hủy'}
                      </p>
                    </div>
                    <p className='text-sm font-bold'>{formatVnd(expense.total_amount)}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className='rounded-2xl border-dashed p-7 text-center'>
                <span className='mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary'>
                  <ReceiptText className='size-6' />
                </span>
                <p className='mt-3 font-semibold'>Chưa có khoản chi</p>
                <p className='mt-1 text-xs text-muted-foreground'>Tạo đơn nháp đầu tiên để bắt đầu chia tiền.</p>
              </Card>
            )}
            <Button variant='outline' className='h-11 w-full justify-between rounded-xl' asChild>
              <Link href={PATHS.DEBTS.INDEX}>
                Xem công nợ của phòng
                <ChevronRight className='size-4' />
              </Link>
            </Button>
          </section>

          <section className='space-y-3'>
            <h2 className='flex items-center gap-2 font-bold'>
              <UsersRound className='size-5 text-primary' />
              Thành viên
            </h2>
            <Card className='divide-y divide-border overflow-hidden rounded-2xl p-0'>
              {room.members.map((member) => (
                <div key={member.id} className='flex min-h-16 items-center gap-3 px-4 py-3'>
                  <span className='grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary'>
                    {member.display_name.charAt(0).toUpperCase()}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-semibold'>{member.nickname || member.display_name}</p>
                    <p className='truncate text-xs text-muted-foreground'>
                      {roleLabels[member.role]} • {member.status}
                    </p>
                  </div>
                  {member.role === 'owner' ? (
                    <Crown className='size-4 text-amber-500' />
                  ) : canManage ? (
                    <div className='flex items-center gap-1'>
                      {room.role === 'owner' && (
                        <button
                          className='text-outline grid size-9 place-items-center rounded-full hover:bg-primary/10 hover:text-primary'
                          aria-label={member.role === 'admin' ? 'Đổi thành thành viên' : 'Đổi thành quản trị'}
                          onClick={() =>
                            updateRole.mutate({
                              memberId: member.id,
                              role: member.role === 'admin' ? 'member' : 'admin'
                            })
                          }
                        >
                          <ShieldCheck className='size-4' />
                        </button>
                      )}
                      <button
                        className='text-outline grid size-9 place-items-center rounded-full hover:bg-destructive/10 hover:text-destructive'
                        aria-label={`Xóa ${member.display_name}`}
                        onClick={() => {
                          if (window.confirm(`Xóa ${member.display_name} khỏi phòng?`)) {
                            removeMember.mutate(member.id)
                          }
                        }}
                      >
                        <Trash2 className='size-4' />
                      </button>
                    </div>
                  ) : (
                    <UserRound className='text-outline size-4' />
                  )}
                </div>
              ))}
            </Card>
          </section>
        </div>

        <section className='space-y-3'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='font-bold'>Danh mục chi tiêu</h2>
              <p className='text-xs text-muted-foreground'>Dùng chung cho mọi hóa đơn trong phòng.</p>
            </div>
            {canManage && (
              <Button variant='outline' size='sm' className='rounded-xl' onClick={() => setShowCategoryForm((v) => !v)}>
                {showCategoryForm ? 'Đóng' : 'Thêm'}
              </Button>
            )}
          </div>

          {showCategoryForm && (
            <Card className='rounded-2xl p-4'>
              <form
                className='flex flex-col gap-3 sm:flex-row'
                onSubmit={(event) => {
                  event.preventDefault()
                  const form = new FormData(event.currentTarget)
                  createCategory.mutate(
                    {
                      name: String(form.get('name')).trim(),
                      icon: 'shapes',
                      color: '#3f51b5'
                    },
                    {
                      onSuccess: () => {
                        event.currentTarget.reset()
                        setShowCategoryForm(false)
                      }
                    }
                  )
                }}
              >
                <Input name='name' placeholder='Tên danh mục mới' required className='flex-1' />
                <Button className='h-11 rounded-xl' disabled={createCategory.isPending}>
                  {createCategory.isPending ? (
                    <Loader2 className='size-4 animate-spin' />
                  ) : (
                    <FolderPlus className='size-4' />
                  )}
                  Lưu danh mục
                </Button>
              </form>
            </Card>
          )}

          <div className='flex flex-wrap gap-2'>
            {categoriesQuery.data?.map((category) => (
              <span
                key={category.id}
                className='rounded-full border bg-card px-3 py-2 text-xs font-semibold'
                style={{ borderColor: category.color ?? undefined }}
              >
                {category.name}
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
