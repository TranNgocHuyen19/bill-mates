'use client'

import * as React from 'react'
import { Archive, ArrowLeft, DoorOpen, Loader2, Save, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PATHS } from '@/constants'
import { useArchiveRoomMutation, useLeaveRoomMutation, useRoomDetailQuery, useUpdateRoomMutation } from '../index'

export function RoomSettingsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const roomId = params.id
  const roomQuery = useRoomDetailQuery(roomId)
  const updateRoom = useUpdateRoomMutation(roomId)
  const archiveRoom = useArchiveRoomMutation(roomId)
  const leaveRoom = useLeaveRoomMutation(roomId)
  const room = roomQuery.data
  const canManage = room?.role === 'owner' || room?.role === 'admin'

  if (roomQuery.isPending) {
    return (
      <div className='grid min-h-screen place-items-center bg-background'>
        <Loader2 className='size-7 animate-spin text-primary' aria-label='Đang tải cài đặt phòng' />
      </div>
    )
  }

  if (!room) {
    return (
      <div className='grid min-h-screen place-items-center bg-background px-4'>
        <Card className='rounded-3xl p-7 text-center'>
          <p className='font-bold'>Không thể mở cài đặt phòng</p>
          <Button asChild className='mt-4 rounded-xl'>
            <Link href={PATHS.ROOMS}>Về danh sách phòng</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background pb-24 text-foreground'>
      <Navbar />
      <main className='mx-auto w-full max-w-2xl space-y-5 px-4 py-5 sm:py-8'>
        <Link
          href={PATHS.ROOM_DETAIL(room.id)}
          className='inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground'
        >
          <ArrowLeft className='size-4' /> Về phòng
        </Link>

        <header>
          <p className='text-xs font-bold tracking-[0.16em] text-primary uppercase'>Quản trị</p>
          <h1 className='mt-1 flex items-center gap-2 text-2xl font-bold'>
            <Settings2 className='size-6 text-primary' /> Cài đặt phòng
          </h1>
        </header>

        {canManage ? (
          <Card className='rounded-3xl p-5 sm:p-6'>
            <form
              className='space-y-4'
              onSubmit={(event) => {
                event.preventDefault()
                const form = new FormData(event.currentTarget)
                updateRoom.mutate({
                  name: String(form.get('name')).trim(),
                  description: String(form.get('description')).trim() || null,
                  currency: String(form.get('currency'))
                })
              }}
            >
              <Input name='name' label='Tên phòng' defaultValue={room.name} minLength={2} required />
              <label className='grid gap-1.5 text-sm font-semibold'>
                Mô tả
                <textarea
                  name='description'
                  defaultValue={room.description ?? ''}
                  rows={4}
                  className='rounded-xl border bg-card px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30'
                  placeholder='Mục đích và quy ước của phòng'
                />
              </label>
              <label className='grid gap-1.5 text-sm font-semibold'>
                Đơn vị tiền
                <select
                  name='currency'
                  defaultValue={room.currency}
                  className='h-11 rounded-xl border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30'
                >
                  <option value='VND'>VND · Việt Nam đồng</option>
                </select>
              </label>
              <Button className='h-11 w-full rounded-xl' disabled={updateRoom.isPending}>
                {updateRoom.isPending ? <Loader2 className='size-4 animate-spin' /> : <Save className='size-4' />}
                Lưu thay đổi
              </Button>
            </form>
          </Card>
        ) : (
          <Card className='rounded-3xl p-5 text-sm text-muted-foreground'>
            Chỉ chủ phòng và quản trị viên mới có thể sửa thông tin phòng.
          </Card>
        )}

        <section className='space-y-3'>
          <h2 className='font-bold text-destructive'>Khu vực cần cẩn thận</h2>
          <Card className='space-y-4 rounded-3xl border-destructive/20 p-5'>
            {room.role === 'owner' ? (
              <>
                <div>
                  <p className='text-sm font-bold'>Lưu trữ phòng</p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Giữ nguyên lịch sử tài chính nhưng không cho tạo khoản chi mới.
                  </p>
                </div>
                <Button
                  variant='destructive'
                  className='h-11 w-full rounded-xl'
                  disabled={archiveRoom.isPending || Boolean(room.archived_at)}
                  onClick={() => {
                    if (window.confirm('Lưu trữ phòng này? Dữ liệu cũ vẫn được giữ lại.')) {
                      archiveRoom.mutate(undefined, {
                        onSuccess: () => router.push(PATHS.ROOMS)
                      })
                    }
                  }}
                >
                  {archiveRoom.isPending ? <Loader2 className='size-4 animate-spin' /> : <Archive className='size-4' />}
                  {room.archived_at ? 'Phòng đã lưu trữ' : 'Lưu trữ phòng'}
                </Button>
              </>
            ) : (
              <>
                <div>
                  <p className='text-sm font-bold'>Rời phòng</p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Lịch sử khoản chi của bạn vẫn được giữ để công nợ không bị sai.
                  </p>
                </div>
                <Button
                  variant='destructive'
                  className='h-11 w-full rounded-xl'
                  disabled={leaveRoom.isPending}
                  onClick={() => {
                    if (window.confirm('Bạn chắc chắn muốn rời phòng?')) {
                      leaveRoom.mutate(undefined, {
                        onSuccess: () => router.push(PATHS.ROOMS)
                      })
                    }
                  }}
                >
                  <DoorOpen className='size-4' /> Rời phòng
                </Button>
              </>
            )}
          </Card>
        </section>
      </main>
    </div>
  )
}
