'use client'

import * as React from 'react'
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileSpreadsheet,
  Loader2,
  PieChart,
  ReceiptText,
  RefreshCcw,
  TrendingUp,
  UsersRound,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { Navbar } from '@/components/navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PATHS } from '@/constants'
import { useRoomsQuery } from '@/features/rooms'
import { getErrorMessage } from '@/lib/error-handler'
import { formatVnd } from '@/lib/money'
import { showSuccessToast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useExpenseReportQuery, useExportExpenseReportMutation } from '../queries'
import type {
  CategoryReport,
  MemberReport,
  MonthlyReport,
  ReportExpense,
  ReportExport,
  ReportFilters,
  ReportSettlement,
  ReportSettlementStatus,
  RoomReport
} from '../schemas'

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const monthFormatter = new Intl.DateTimeFormat('vi-VN', { month: 'short', year: '2-digit' })
const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
const shortDateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' })
const categoryFallbackColors = [
  'var(--primary)',
  'var(--secondary)',
  'var(--tertiary)',
  'var(--primary-container)',
  'var(--secondary-container)'
] as const

const settlementStatusContent: Record<
  ReportSettlementStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  pending: { label: 'Chờ xác nhận', icon: Clock3, tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  confirmed: { label: 'Đã xác nhận', icon: CheckCircle2, tone: 'bg-secondary/10 text-secondary' },
  rejected: { label: 'Bị từ chối', icon: XCircle, tone: 'bg-destructive/10 text-destructive' },
  cancelled: { label: 'Đã hủy', icon: XCircle, tone: 'bg-muted text-muted-foreground' }
}

interface DateRange {
  fromDate: string
  toDate: string
}

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCurrentMonthRange(): DateRange {
  const now = new Date()
  return {
    fromDate: toLocalIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    toDate: toLocalIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  }
}

function isValidIsoDate(value: string | null): value is string {
  if (!value || !ISO_DATE_PATTERN.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function getInitialDateRange(searchParams: URLSearchParams): DateRange {
  const fallback = getCurrentMonthRange()
  const fromDate = searchParams.get('from')
  const toDate = searchParams.get('to')

  if (isValidIsoDate(fromDate) && isValidIsoDate(toDate) && fromDate <= toDate) {
    return { fromDate, toDate }
  }

  return fallback
}

function getDateError(range: DateRange): string {
  if (!isValidIsoDate(range.fromDate) || !isValidIsoDate(range.toDate)) {
    return 'Chọn đầy đủ ngày bắt đầu và ngày kết thúc.'
  }
  if (range.fromDate > range.toDate) {
    return 'Ngày bắt đầu không thể sau ngày kết thúc.'
  }
  return ''
}

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)
  if (!year || !monthNumber) return month
  return monthFormatter.format(new Date(year, monthNumber - 1, 1))
}

function formatReportDate(value: string): string {
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}

function formatShortDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : shortDateFormatter.format(date)
}

function getCategoryColor(color: string | null, index: number): string {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : categoryFallbackColors[index % categoryFallbackColors.length]
}

function saveReportFile({ blob, filename }: ReportExport): void {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'text-primary'
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  detail: string
  tone?: string
}) {
  return (
    <Card className='min-w-0 rounded-3xl p-4 sm:p-5'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-xs font-semibold text-muted-foreground'>{label}</p>
          <p className='mt-2 text-xl font-bold tracking-tight break-words tabular-nums sm:text-2xl'>{value}</p>
          <p className='mt-1 text-xs leading-5 text-muted-foreground'>{detail}</p>
        </div>
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-2xl bg-current/10', tone)}>
          <Icon className='size-5' />
        </span>
      </div>
    </Card>
  )
}

function DailyExpenseChart({ data }: { data: ReportExpense[] }) {
  const dailyTotals = new Map<string, { total: number; count: number }>()
  for (const expense of data) {
    const current = dailyTotals.get(expense.expense_date) ?? { total: 0, count: 0 }
    current.total += Number(expense.total)
    current.count += 1
    dailyTotals.set(expense.expense_date, current)
  }

  const trend = [...dailyTotals.entries()]
    .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
    .map(([date, values]) => ({ date, ...values }))
  const maxTotal = Math.max(1, ...trend.map((item) => item.total))
  const chartWidth = 400
  const chartHeight = 180
  const chartTop = 14
  const chartBottom = 160
  const chartLeft = 18
  const chartRight = 382
  const points = trend.map((item, index) => {
    const x =
      trend.length === 1
        ? chartWidth / 2
        : chartLeft + (index / Math.max(1, trend.length - 1)) * (chartRight - chartLeft)
    const y = chartBottom - (item.total / maxTotal) * (chartBottom - chartTop)
    return { ...item, x, y }
  })
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const areaPath =
    points.length > 1
      ? `M ${points[0].x} ${chartBottom} ${points.map((point) => `L ${point.x} ${point.y}`).join(' ')} L ${points.at(-1)?.x ?? chartRight} ${chartBottom} Z`
      : ''
  const peak = trend.reduce<(typeof trend)[number] | null>(
    (currentPeak, item) => (!currentPeak || item.total > currentPeak.total ? item : currentPeak),
    null
  )

  return (
    <Card className='overflow-hidden rounded-3xl p-0'>
      <div className='flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-5'>
        <div>
          <h2 className='flex items-center gap-2 font-bold'>
            <TrendingUp className='size-5 text-primary' />
            Nhịp chi theo ngày
          </h2>
          <p className='mt-1 text-xs text-muted-foreground'>Nhìn nhanh ngày nào phát sinh nhiều nhất.</p>
        </div>
        <Badge variant='outline' className='shrink-0 rounded-full'>
          {trend.length} ngày có chi
        </Badge>
      </div>

      {points.length > 0 ? (
        <div className='px-4 py-4 sm:px-5'>
          <div className='mb-3 flex items-end justify-between gap-3'>
            <div>
              <p className='text-[11px] font-semibold text-muted-foreground uppercase'>Cao nhất</p>
              <p className='mt-1 text-lg font-bold tabular-nums'>{formatVnd(peak?.total ?? 0)}</p>
            </div>
            <p className='text-right text-xs text-muted-foreground'>
              {peak ? formatShortDate(peak.date) : ''}
              <br />
              {peak?.count ?? 0} khoản chi
            </p>
          </div>

          <div
            role='img'
            aria-label={`Xu hướng chi theo ngày. Cao nhất ${formatVnd(peak?.total ?? 0)} vào ${peak ? formatShortDate(peak.date) : ''}.`}
            className='rounded-2xl bg-[linear-gradient(180deg,color-mix(in_oklch,var(--primary)_8%,transparent),transparent)] px-1 pt-2'
          >
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className='h-48 w-full' aria-hidden='true'>
              <defs>
                <linearGradient id='daily-expense-area' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor='var(--primary)' stopOpacity='0.28' />
                  <stop offset='100%' stopColor='var(--primary)' stopOpacity='0.02' />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = chartBottom - ratio * (chartBottom - chartTop)
                return (
                  <line
                    key={ratio}
                    x1={chartLeft}
                    x2={chartRight}
                    y1={y}
                    y2={y}
                    stroke='var(--border)'
                    strokeDasharray='4 7'
                    strokeOpacity='0.7'
                  />
                )
              })}
              {points.length === 1 ? (
                <rect
                  x={points[0].x - 24}
                  y={points[0].y}
                  width='48'
                  height={chartBottom - points[0].y}
                  rx='12'
                  fill='url(#daily-expense-area)'
                  stroke='var(--primary)'
                  strokeWidth='3'
                />
              ) : (
                <>
                  <path d={areaPath} fill='url(#daily-expense-area)' />
                  <path
                    d={linePath}
                    fill='none'
                    stroke='var(--primary)'
                    strokeWidth='4'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </>
              )}
              {points.map((point) => (
                <circle
                  key={point.date}
                  cx={point.x}
                  cy={point.y}
                  r='5'
                  fill='var(--card)'
                  stroke='var(--primary)'
                  strokeWidth='3'
                >
                  <title>
                    {formatShortDate(point.date)}: {formatVnd(point.total)}
                  </title>
                </circle>
              ))}
            </svg>
          </div>

          <div className='mt-1 flex justify-between text-[11px] font-semibold text-muted-foreground'>
            <span>{formatShortDate(trend[0].date)}</span>
            <span>{trend.length > 2 ? formatShortDate(trend[Math.floor(trend.length / 2)].date) : ''}</span>
            <span>{formatShortDate(trend.at(-1)?.date ?? '')}</span>
          </div>
        </div>
      ) : (
        <div className='px-5 py-8 text-center text-sm text-muted-foreground'>Chưa có khoản chi để vẽ xu hướng.</div>
      )}
    </Card>
  )
}

function MonthlyChart({ data }: { data: MonthlyReport[] }) {
  const maxTotal = Math.max(1, ...data.map((item) => Number(item.total)))

  return (
    <Card className='overflow-hidden rounded-3xl p-0'>
      <div className='flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-5'>
        <div>
          <h2 className='flex items-center gap-2 font-bold'>
            <TrendingUp className='size-5 text-primary' />
            Nhịp chi theo tháng
          </h2>
          <p className='mt-1 text-xs text-muted-foreground'>Chỉ tính khoản chi đã chốt trong kỳ.</p>
        </div>
        <Badge variant='outline' className='shrink-0 rounded-full'>
          {data.length} tháng
        </Badge>
      </div>

      {data.length > 0 ? (
        <div
          className='overflow-x-auto px-4 py-5 sm:px-5'
          role='img'
          aria-label={`Biểu đồ chi tiêu ${data.map((item) => `${formatMonth(item.month)} ${formatVnd(item.total)}`).join(', ')}`}
        >
          <div className='flex h-52 min-w-max items-end gap-3 border-b border-dashed border-border pb-3'>
            {data.map((item) => {
              const barHeight = Math.max(10, (Number(item.total) / maxTotal) * 100)
              return (
                <div key={item.month} className='flex h-full w-20 flex-col justify-end gap-2 text-center sm:w-24'>
                  <span className='text-[10px] font-bold text-foreground tabular-nums'>{formatVnd(item.total)}</span>
                  <div className='flex h-32 items-end justify-center'>
                    <span
                      className='w-9 rounded-t-xl bg-gradient-to-t from-primary to-primary/55 shadow-sm'
                      style={{ height: `${barHeight}%` }}
                    />
                  </div>
                  <span className='text-[11px] font-semibold text-muted-foreground'>{formatMonth(item.month)}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className='px-5 py-8 text-center text-sm text-muted-foreground'>Chưa có dữ liệu theo tháng.</div>
      )}
    </Card>
  )
}

function CategoryBreakdown({ data, totalExpenses }: { data: CategoryReport[]; totalExpenses: string }) {
  const reportTotal = Number(totalExpenses)
  const categorySegments = data.reduce<
    Array<CategoryReport & { percentage: number; color: string; start: number; end: number }>
  >((segments, item, index) => {
    const percentage = reportTotal > 0 ? Math.max(0, (Number(item.total) / reportTotal) * 100) : 0
    const start = segments.at(-1)?.end ?? 0
    const segment = {
      ...item,
      percentage,
      color: getCategoryColor(item.color, index),
      start,
      end: start + percentage
    }
    return [...segments, segment]
  }, [])
  const donutBackground =
    categorySegments.length > 0
      ? `conic-gradient(from -90deg, ${categorySegments
          .map((item) => `${item.color} ${item.start}% ${item.end}%`)
          .join(', ')})`
      : 'var(--muted)'

  return (
    <Card className='overflow-hidden rounded-3xl p-0'>
      <div className='border-b px-4 py-4 sm:px-5'>
        <h2 className='flex items-center gap-2 font-bold'>
          <PieChart className='size-5 text-primary' />
          Cơ cấu danh mục
        </h2>
        <p className='mt-1 text-xs text-muted-foreground'>Khoản nào đang chiếm nhiều ngân sách nhất.</p>
      </div>

      {data.length > 0 ? (
        <div className='grid items-center gap-5 p-4 sm:grid-cols-[176px_1fr] sm:p-5'>
          <div
            role='img'
            aria-label={`Cơ cấu chi theo danh mục: ${categorySegments
              .map((item) => `${item.name} ${item.percentage.toFixed(1)}%`)
              .join(', ')}`}
            className='relative mx-auto aspect-square w-40 rounded-full shadow-inner sm:w-44'
            style={{ background: donutBackground }}
          >
            <div className='absolute inset-[21%] grid place-items-center rounded-full bg-card text-center shadow-sm'>
              <div>
                <p className='text-[10px] font-semibold text-muted-foreground uppercase'>Tổng chi</p>
                <p className='mt-1 text-sm font-bold tabular-nums'>{formatVnd(totalExpenses)}</p>
              </div>
            </div>
          </div>

          <div className='space-y-3'>
            {categorySegments.map((item) => (
              <div key={item.category_id ?? item.name} className='flex min-w-0 items-center gap-2.5'>
                <span className='size-3 shrink-0 rounded-full' style={{ backgroundColor: item.color }} />
                <div className='min-w-0 flex-1'>
                  <div className='flex items-baseline justify-between gap-2'>
                    <span className='truncate text-xs font-semibold'>{item.name || 'Chưa phân loại'}</span>
                    <span className='shrink-0 text-xs font-bold tabular-nums'>
                      {item.percentage.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%
                    </span>
                  </div>
                  <p className='mt-0.5 text-[11px] text-muted-foreground tabular-nums'>{formatVnd(item.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className='p-8 text-center text-sm text-muted-foreground'>Chưa có danh mục phát sinh trong kỳ.</p>
      )}
    </Card>
  )
}

function MemberBreakdown({ data }: { data: MemberReport[] }) {
  const maxAmount = Math.max(1, ...data.flatMap((member) => [Number(member.paid), Number(member.owed)]))

  return (
    <Card className='rounded-3xl p-4 sm:p-5'>
      <h2 className='flex items-center gap-2 font-bold'>
        <UsersRound className='size-5 text-primary' />
        Đóng góp thành viên
      </h2>
      <p className='mt-1 text-xs text-muted-foreground'>So sánh số đã trả và phần được chia.</p>

      {data.length > 0 ? (
        <div className='mt-4 space-y-3'>
          {data.map((member) => {
            const balance = Number(member.balance)
            const paidPercentage = Math.max(0, (Number(member.paid) / maxAmount) * 100)
            const owedPercentage = Math.max(0, (Number(member.owed) / maxAmount) * 100)
            return (
              <div key={member.member_id} className='rounded-2xl border bg-muted/30 p-3.5'>
                <div className='flex min-w-0 items-center gap-3'>
                  <span className='grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary'>
                    {member.display_name.charAt(0).toUpperCase()}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-bold'>{member.display_name}</p>
                    <p className='mt-0.5 text-xs text-muted-foreground'>So sánh trên cùng một thang đo</p>
                  </div>
                  <div className='shrink-0 text-right'>
                    <p
                      className={cn(
                        'text-sm font-bold tabular-nums',
                        balance >= 0 ? 'text-secondary' : 'text-destructive'
                      )}
                    >
                      {balance > 0 ? '+' : ''}
                      {formatVnd(member.balance)}
                    </p>
                    <p className='text-[10px] text-muted-foreground'>{balance >= 0 ? 'số dư dương' : 'số dư âm'}</p>
                  </div>
                </div>

                <div
                  className='mt-3 space-y-2.5 border-t pt-3'
                  role='img'
                  aria-label={`${member.display_name}: đã trả ${formatVnd(member.paid)}, phải chịu ${formatVnd(member.owed)}`}
                >
                  <div className='grid grid-cols-[64px_1fr_auto] items-center gap-2'>
                    <span className='text-[11px] font-semibold text-primary'>Đã trả</span>
                    <div className='h-2.5 overflow-hidden rounded-full bg-muted'>
                      <div
                        className='h-full rounded-full bg-primary'
                        style={{ width: `${Number(member.paid) > 0 ? Math.max(3, paidPercentage) : 0}%` }}
                      />
                    </div>
                    <span className='w-20 text-right text-[11px] font-bold tabular-nums'>{formatVnd(member.paid)}</span>
                  </div>
                  <div className='grid grid-cols-[64px_1fr_auto] items-center gap-2'>
                    <span className='text-[11px] font-semibold text-tertiary'>Phải chịu</span>
                    <div className='h-2.5 overflow-hidden rounded-full bg-muted'>
                      <div
                        className='h-full rounded-full bg-tertiary'
                        style={{ width: `${Number(member.owed) > 0 ? Math.max(3, owedPercentage) : 0}%` }}
                      />
                    </div>
                    <span className='w-20 text-right text-[11px] font-bold tabular-nums'>{formatVnd(member.owed)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className='mt-5 rounded-2xl bg-muted/60 p-5 text-center text-sm text-muted-foreground'>
          Chưa có đóng góp thành viên trong kỳ.
        </p>
      )}
    </Card>
  )
}

function BalanceList({ data }: { data: MemberReport[] }) {
  return (
    <section className='space-y-3' aria-labelledby='report-balances-title'>
      <div>
        <h2 id='report-balances-title' className='flex items-center gap-2 font-bold'>
          <CircleDollarSign className='size-5 text-primary' />
          Số dư trong kỳ
        </h2>
        <p className='mt-1 text-xs text-muted-foreground'>Đã gồm thanh toán xác nhận trong khoảng ngày đã chọn.</p>
      </div>

      {data.length > 0 ? (
        <div className='grid gap-3 sm:grid-cols-2'>
          {data.map((member) => {
            const balance = Number(member.balance)
            return (
              <Card
                key={member.member_id}
                accent={balance > 0 ? 'success' : balance < 0 ? 'destructive' : undefined}
                className='min-w-0 rounded-2xl p-4'
              >
                <div className='flex min-w-0 items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-bold'>{member.display_name}</p>
                    <p className='mt-1 text-xs leading-5 text-muted-foreground'>
                      Gửi {formatVnd(member.settlements_sent)} · Nhận {formatVnd(member.settlements_received)}
                    </p>
                  </div>
                  <div className='shrink-0 text-right'>
                    <p
                      className={cn(
                        'text-sm font-bold tabular-nums',
                        balance > 0 ? 'text-secondary' : balance < 0 ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    >
                      {balance > 0 ? '+' : ''}
                      {formatVnd(member.balance)}
                    </p>
                    <p className='mt-1 text-[10px] text-muted-foreground'>
                      {balance > 0 ? 'cần nhận' : balance < 0 ? 'cần trả' : 'đã cân bằng'}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className='rounded-2xl border-dashed p-6 text-center text-sm text-muted-foreground'>
          Chưa có số dư phát sinh trong kỳ.
        </Card>
      )}
    </section>
  )
}

function SettlementList({ data }: { data: ReportSettlement[] }) {
  return (
    <section className='space-y-3' aria-labelledby='report-settlements-title'>
      <div>
        <h2 id='report-settlements-title' className='flex items-center gap-2 font-bold'>
          <ReceiptText className='size-5 text-primary' />
          Thanh toán trong kỳ
        </h2>
        <p className='mt-1 text-xs text-muted-foreground'>Theo dõi cả giao dịch đang chờ, đã xác nhận hoặc đã hủy.</p>
      </div>

      {data.length > 0 ? (
        <div className='space-y-2'>
          {data.map((settlement) => {
            const status = settlementStatusContent[settlement.status]
            const StatusIcon = status.icon
            return (
              <Card key={settlement.settlement_id} className='min-w-0 rounded-2xl p-4'>
                <div className='flex min-w-0 items-start gap-3'>
                  <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', status.tone)}>
                    <StatusIcon className='size-4' />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-bold'>
                      {settlement.from_name} → {settlement.to_name}
                    </p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      {formatReportDate(settlement.created_at)} · {status.label}
                    </p>
                  </div>
                  <p className='shrink-0 text-sm font-bold tabular-nums'>{formatVnd(settlement.amount)}</p>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className='rounded-2xl border-dashed p-6 text-center text-sm text-muted-foreground'>
          Chưa có thanh toán nào trong khoảng ngày này.
        </Card>
      )}
    </section>
  )
}

function ReportContent({ report }: { report: RoomReport }) {
  const hasActivity = report.summary.posted_expense_count > 0 || report.settlements.length > 0

  return (
    <div className='space-y-6'>
      <p className='text-right text-[11px] text-muted-foreground'>
        Tạo lúc {new Date(report.generated_at).toLocaleString('vi-VN')} · Múi giờ {report.timezone}
      </p>
      <section className='grid grid-cols-2 gap-3 lg:grid-cols-4' aria-label='Tổng quan báo cáo'>
        <SummaryMetric
          icon={ReceiptText}
          label='Tổng chi đã chốt'
          value={formatVnd(report.summary.total_expenses)}
          detail={`${report.summary.posted_expense_count} khoản chi`}
        />
        <SummaryMetric
          icon={UsersRound}
          label='Thành viên'
          value={report.summary.member_count.toLocaleString('vi-VN')}
          detail='Có phát sinh trong báo cáo'
          tone='text-secondary'
        />
        <SummaryMetric
          icon={CheckCircle2}
          label='Đã thanh toán'
          value={formatVnd(report.summary.confirmed_settlement_amount)}
          detail={`${report.summary.confirmed_settlement_count} giao dịch xác nhận`}
          tone='text-secondary'
        />
        <SummaryMetric
          icon={CalendarDays}
          label='Khoảng báo cáo'
          value={`${formatReportDate(report.from_date)}`}
          detail={`đến ${formatReportDate(report.to_date)}`}
          tone='text-amber-700 dark:text-amber-300'
        />
      </section>

      {!hasActivity ? (
        <Card className='rounded-3xl border-dashed p-8 text-center sm:p-10'>
          <span className='mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary'>
            <BarChart3 className='size-7' />
          </span>
          <h2 className='mt-4 text-lg font-bold'>Khoảng thời gian này chưa có phát sinh</h2>
          <p className='mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground'>
            Thử mở rộng khoảng ngày hoặc chọn phòng khác. Bạn vẫn có thể xuất Excel với đầy đủ tiêu đề và số liệu bằng
            0.
          </p>
        </Card>
      ) : null}

      <div className='grid gap-5 lg:grid-cols-[1.15fr_0.85fr]'>
        <DailyExpenseChart data={report.expenses} />
        <CategoryBreakdown data={report.categories} totalExpenses={report.summary.total_expenses} />
      </div>

      {report.monthly.length > 1 ? <MonthlyChart data={report.monthly} /> : null}
      <MemberBreakdown data={report.members} />
      <BalanceList data={report.members} />
      <SettlementList data={report.settlements} />
    </div>
  )
}

function ReportsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomsQuery = useRoomsQuery()
  const [selectedRoomId, setSelectedRoomId] = React.useState(() => searchParams.get('roomId') ?? '')
  const [draftDates, setDraftDates] = React.useState<DateRange>(() => getInitialDateRange(searchParams))
  const [appliedDates, setAppliedDates] = React.useState<DateRange>(() => getInitialDateRange(searchParams))
  const [dateError, setDateError] = React.useState('')
  const activeRoomId = roomsQuery.data?.some((room) => room.id === selectedRoomId)
    ? selectedRoomId
    : (roomsQuery.data?.[0]?.id ?? '')
  const selectedRoom = roomsQuery.data?.find((room) => room.id === activeRoomId)
  const filters: ReportFilters = {
    roomId: activeRoomId,
    fromDate: appliedDates.fromDate,
    toDate: appliedDates.toDate
  }
  const reportQuery = useExpenseReportQuery(filters)
  const exportReport = useExportExpenseReportMutation()
  const hasPendingDateChanges =
    draftDates.fromDate !== appliedDates.fromDate || draftDates.toDate !== appliedDates.toDate

  const updateUrl = React.useCallback(
    (roomId: string, dates: DateRange) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('roomId', roomId)
      params.set('from', dates.fromDate)
      params.set('to', dates.toDate)
      router.replace(`${PATHS.REPORTS}?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId)
    setDateError('')
    updateUrl(roomId, appliedDates)
  }

  const handleApplyDates = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationMessage = getDateError(draftDates)
    setDateError(validationMessage)
    if (validationMessage) return

    setAppliedDates(draftDates)
    updateUrl(activeRoomId, draftDates)
  }

  const handleResetDates = () => {
    const currentMonth = getCurrentMonthRange()
    setDraftDates(currentMonth)
    setAppliedDates(currentMonth)
    setDateError('')
    updateUrl(activeRoomId, currentMonth)
  }

  const handleExport = () => {
    if (getDateError(draftDates) || hasPendingDateChanges) return

    exportReport.mutate(filters, {
      onSuccess: (file) => {
        saveReportFile(file)
        showSuccessToast('Đã tải báo cáo Excel.')
      }
    })
  }

  if (roomsQuery.isPending) {
    return (
      <div className='grid min-h-screen place-items-center bg-background'>
        <Loader2 className='size-7 animate-spin text-primary' aria-label='Đang tải báo cáo' />
      </div>
    )
  }

  if (roomsQuery.isError) {
    return (
      <div className='min-h-screen bg-background'>
        <Navbar />
        <main className='mx-auto max-w-lg px-4 py-10'>
          <Card className='rounded-3xl p-8 text-center'>
            <XCircle className='mx-auto size-10 text-destructive' />
            <h1 className='mt-4 text-xl font-bold'>Không thể tải danh sách phòng</h1>
            <p className='mt-2 text-sm text-muted-foreground'>Kiểm tra kết nối rồi thử lại để mở báo cáo.</p>
            <Button className='mt-5 h-11 rounded-xl' onClick={() => roomsQuery.refetch()}>
              <RefreshCcw className='size-4' />
              Thử lại
            </Button>
          </Card>
        </main>
      </div>
    )
  }

  if (!roomsQuery.data?.length) {
    return (
      <div className='min-h-screen bg-background'>
        <Navbar />
        <main className='mx-auto max-w-lg px-4 py-10'>
          <Card className='rounded-3xl p-8 text-center'>
            <BarChart3 className='mx-auto size-10 text-primary' />
            <h1 className='mt-4 text-xl font-bold'>Chưa có phòng để lập báo cáo</h1>
            <p className='mt-2 text-sm leading-6 text-muted-foreground'>
              Tạo hoặc tham gia một phòng, sau đó các khoản chi đã chốt sẽ xuất hiện tại đây.
            </p>
            <Button asChild className='mt-5 h-11 rounded-xl'>
              <Link href={PATHS.ROOMS}>Đến danh sách phòng</Link>
            </Button>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className='min-h-screen overflow-x-clip bg-background pb-24 text-foreground'>
      <Navbar />
      <main className='mx-auto w-full max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-8'>
        <section className='relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-xl shadow-primary/15 sm:p-7'>
          <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,color-mix(in_oklch,var(--primary-foreground)_18%,transparent),transparent_34%),linear-gradient(135deg,transparent_48%,color-mix(in_oklch,var(--secondary)_42%,transparent))]' />
          <div className='pointer-events-none absolute -right-14 -bottom-20 size-52 rounded-full border-[30px] border-primary-foreground/5' />
          <div className='relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between'>
            <div className='min-w-0'>
              <Badge className='border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/10'>
                Sổ tài chính · {reportQuery.data?.currency ?? selectedRoom?.currency ?? 'VND'}
              </Badge>
              <h1 className='mt-4 text-2xl font-bold tracking-tight sm:text-3xl'>Báo cáo chi tiêu</h1>
              <p className='mt-2 max-w-2xl text-sm leading-6 text-primary-foreground/75'>
                Nhìn lại tiền đã chi, phần mỗi người chịu và thanh toán đã xác nhận trong một khoảng thời gian.
              </p>
              <p className='mt-4 truncate text-sm font-semibold'>
                {reportQuery.data?.room_name ?? selectedRoom?.name} ·{' '}
                {formatReportDate(reportQuery.data?.from_date ?? appliedDates.fromDate)} –{' '}
                {formatReportDate(reportQuery.data?.to_date ?? appliedDates.toDate)}
              </p>
            </div>

            <Button
              type='button'
              variant='secondary'
              className='h-12 w-full rounded-2xl px-5 sm:w-auto'
              onClick={handleExport}
              disabled={exportReport.isPending || hasPendingDateChanges || Boolean(getDateError(draftDates))}
              aria-busy={exportReport.isPending}
            >
              {exportReport.isPending ? (
                <Loader2 className='size-4 animate-spin' />
              ) : (
                <FileSpreadsheet className='size-4' />
              )}
              {exportReport.isPending ? 'Đang tạo Excel...' : 'Xuất Excel'}
            </Button>
          </div>
        </section>

        <Card className='rounded-3xl p-4 sm:p-5'>
          <form className='grid min-w-0 gap-4 lg:grid-cols-[1.15fr_1fr_1fr_auto]' onSubmit={handleApplyDates}>
            <div className='grid min-w-0 gap-1.5'>
              <label htmlFor='reports-room' className='text-xs font-semibold text-muted-foreground'>
                Phòng báo cáo
              </label>
              <Select value={activeRoomId} onValueChange={handleRoomChange}>
                <SelectTrigger id='reports-room' className='w-full bg-background font-semibold'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roomsQuery.data.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      <span className='block min-w-0 truncate'>{room.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input
              id='reports-from-date'
              type='date'
              label='Từ ngày'
              value={draftDates.fromDate}
              max={draftDates.toDate || undefined}
              onChange={(event) => {
                setDraftDates((current) => ({ ...current, fromDate: event.target.value }))
                setDateError('')
              }}
              aria-invalid={Boolean(dateError)}
              aria-describedby={dateError ? 'reports-date-error' : undefined}
            />

            <Input
              id='reports-to-date'
              type='date'
              label='Đến ngày'
              value={draftDates.toDate}
              min={draftDates.fromDate || undefined}
              onChange={(event) => {
                setDraftDates((current) => ({ ...current, toDate: event.target.value }))
                setDateError('')
              }}
              aria-invalid={Boolean(dateError)}
              aria-describedby={dateError ? 'reports-date-error' : undefined}
            />

            <div className='flex items-end gap-2'>
              <Button type='submit' className='h-12 min-w-0 flex-1 rounded-xl px-5 lg:flex-none'>
                <BarChart3 className='size-4' />
                Áp dụng
              </Button>
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='size-12 rounded-xl'
                aria-label='Đặt lại tháng hiện tại'
                onClick={handleResetDates}
              >
                <RefreshCcw className='size-4' />
              </Button>
            </div>
          </form>

          {dateError ? (
            <p id='reports-date-error' className='mt-3 text-xs font-semibold text-destructive' role='alert'>
              {dateError}
            </p>
          ) : hasPendingDateChanges ? (
            <p className='mt-3 text-xs text-muted-foreground'>Áp dụng khoảng ngày mới trước khi xuất Excel.</p>
          ) : null}

          {exportReport.isError ? (
            <p className='mt-3 text-xs font-semibold text-destructive' role='alert'>
              Không thể xuất Excel: {getErrorMessage(exportReport.error)}
            </p>
          ) : null}
        </Card>

        {reportQuery.isPending ? (
          <div className='space-y-4' aria-label='Đang tổng hợp báo cáo'>
            <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
              {Array.from({ length: 4 }, (_, index) => (
                <Card key={index} className='h-32 animate-pulse rounded-3xl bg-muted' />
              ))}
            </div>
            <Card className='h-72 animate-pulse rounded-3xl bg-muted' />
          </div>
        ) : reportQuery.isError ? (
          <Card className='rounded-3xl border-destructive/25 p-7 text-center sm:p-9' role='alert'>
            <XCircle className='mx-auto size-10 text-destructive' />
            <h2 className='mt-4 text-lg font-bold'>Chưa thể tổng hợp báo cáo</h2>
            <p className='mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground'>
              {getErrorMessage(reportQuery.error)} Kiểm tra kết nối hoặc thử lại với khoảng ngày khác.
            </p>
            <Button variant='outline' className='mt-5 h-11 rounded-xl' onClick={() => reportQuery.refetch()}>
              <RefreshCcw className='size-4' />
              Tải lại báo cáo
            </Button>
          </Card>
        ) : reportQuery.data ? (
          <ReportContent report={reportQuery.data} />
        ) : null}
      </main>
    </div>
  )
}

export function ReportsPage() {
  return (
    <React.Suspense
      fallback={
        <div className='grid min-h-screen place-items-center bg-background'>
          <Loader2 className='size-7 animate-spin text-primary' aria-label='Đang mở báo cáo' />
        </div>
      }
    >
      <ReportsContent />
    </React.Suspense>
  )
}
