'use client'

import { DoorOpen, Loader2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useJoinRoomMutation } from '@/features/rooms'

export default function JoinRoomPage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const joinRoom = useJoinRoomMutation()

  return (
    <main className='grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#dee0ff,#fbf8ff_55%)] px-4'>
      <Card className='w-full max-w-md rounded-3xl p-6 text-center shadow-xl sm:p-8'>
        <span className='mx-auto grid size-16 place-items-center rounded-2xl bg-primary text-white'>
          <DoorOpen className='size-8' />
        </span>
        <p className='mt-5 text-xs font-semibold tracking-[0.16em] text-primary uppercase'>Lời mời Bill Mates</p>
        <h1 className='mt-2 text-2xl font-bold'>Tham gia phòng chia chi phí</h1>
        <p className='mt-3 text-sm leading-6 text-muted-foreground'>
          Sau khi tham gia, bạn sẽ thấy các khoản chi, phần tiền của mình và lịch sử thanh toán.
        </p>
        <Button
          className='mt-6 h-12 w-full rounded-xl'
          disabled={joinRoom.isPending || joinRoom.isSuccess}
          onClick={() =>
            joinRoom.mutate(params.token, {
              onSuccess: ({ room_id }) => router.replace(`/rooms/${room_id}`)
            })
          }
        >
          {joinRoom.isPending && <Loader2 className='size-4 animate-spin' />}
          {joinRoom.isPending ? 'Đang tham gia...' : 'Xác nhận tham gia phòng'}
        </Button>
      </Card>
    </main>
  )
}
