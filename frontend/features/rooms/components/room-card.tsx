import { ArrowRight, Crown, UsersRound } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { PATHS } from '@/constants'
import { formatVnd } from '@/lib/money'
import type { RoomSummary } from '../api'

const roleLabels = {
  owner: 'Chủ phòng',
  admin: 'Quản trị',
  member: 'Thành viên'
}

export function RoomCard({ room }: { room: RoomSummary }) {
  return (
    <Link href={PATHS.ROOM_DETAIL(room.id)} className='block'>
      <Card className='group border-outline-variant/35 relative overflow-hidden rounded-2xl p-0 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg'>
        <div className='h-1.5 bg-[linear-gradient(90deg,#24389c,#3f51b5,#006c49)]' />
        <div className='p-4 sm:p-5'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <h2 className='truncate text-base font-bold group-hover:text-primary sm:text-lg'>{room.name}</h2>
              <p className='mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground'>
                {room.description || 'Phòng chia chi phí chung'}
              </p>
            </div>
            <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary'>
              {room.role === 'owner' ? <Crown className='size-5' /> : <UsersRound className='size-5' />}
            </span>
          </div>

          <div className='mt-4 flex flex-wrap items-center gap-2'>
            <Badge variant='secondary'>{roleLabels[room.role]}</Badge>
            <span className='text-xs text-muted-foreground'>{room.member_count} thành viên</span>
            {room.archived_at && <Badge variant='outline'>Đã lưu trữ</Badge>}
          </div>

          <div className='mt-4 flex items-end justify-between border-t border-border/60 pt-4'>
            <div>
              <p className='text-[11px] tracking-wide text-muted-foreground uppercase'>Tổng chi đã chốt</p>
              <p className='mt-0.5 text-lg font-bold'>{formatVnd(room.total_expenses)}</p>
            </div>
            <span className='grid size-9 place-items-center rounded-full bg-primary text-white transition group-hover:translate-x-1'>
              <ArrowRight className='size-4' />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
