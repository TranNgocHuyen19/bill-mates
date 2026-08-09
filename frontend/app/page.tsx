import Link from 'next/link'
import { Wallet, ArrowRight, Plus, Users, Receipt, BellRing, CheckCircle, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/navbar'
import { PATHS } from '@/constants'

export const metadata = {
  title: 'BillMates - Chia tiền thông minh, giữ gìn hòa khí',
  description: 'Giải pháp quản lý chi tiêu nhóm, chia phòng và hóa đơn nhóm nhanh chóng, minh bạch.'
}

export default function WelcomePage() {
  return (
    <div className='flex min-h-screen flex-col bg-background font-sans text-foreground transition-colors duration-300'>
      {/* 1. Dynamic Header Navbar with Auth state */}
      <Navbar />

      {/* 2. Hero Section */}
      <section className='relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 to-transparent py-16 md:py-24'>
        {/* Decorative ambient background */}
        <div className='absolute top-[20%] right-[-10%] -z-10 h-[350px] w-[350px] rounded-full bg-primary/10 blur-3xl' />
        <div className='absolute bottom-[10%] left-[-10%] -z-10 h-[250px] w-[250px] rounded-full bg-secondary/10 blur-2xl' />

        <div className='mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2'>
          {/* Hero Left Column */}
          <div className='space-y-6 text-center lg:text-left'>
            <Badge variant='default' className='px-3 py-1'>
              🎉 Trải nghiệm BillMates hoàn toàn mới
            </Badge>
            <h1 className='text-4xl leading-[1.15] font-bold tracking-tight text-foreground md:text-5xl'>
              Chia tiền thông minh,
              <br className='hidden md:inline' />
              <span className='text-primary'>giữ gìn hòa khí.</span>
            </h1>
            <p className='mx-auto max-w-lg text-base leading-relaxed font-light text-muted-foreground md:text-lg lg:mx-0'>
              Giải pháp tối ưu xóa tan sự ngại ngùng khi chia tiền nhà, tiền ăn uống cùng bạn bè hay đồng nghiệp. Tính
              toán tự động, chính xác đến từng đồng.
            </p>
            <div className='flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start'>
              <Button size='lg' className='h-12 w-full px-6 text-sm font-semibold sm:w-auto' asChild>
                <Link href={PATHS.AUTH.REGISTER}>
                  Bắt đầu miễn phí <ArrowRight className='ml-1 size-4' />
                </Link>
              </Button>
              <Button variant='outline' size='lg' className='h-12 w-full px-6 text-sm font-semibold sm:w-auto' asChild>
                <a href='#how-it-works'>Xem cách hoạt động</a>
              </Button>
            </div>
            <div className='flex justify-center gap-6 pt-4 text-xs font-medium text-muted-foreground lg:justify-start'>
              <span className='flex items-center gap-1'>
                <CheckCircle className='size-3.5 text-secondary' /> Không cần cài đặt app
              </span>
              <span className='flex items-center gap-1'>
                <CheckCircle className='size-3.5 text-secondary' /> Hỗ trợ quét hóa đơn AI
              </span>
            </div>
          </div>

          {/* Hero Right Column: Interactive Stitch Style Mockup */}
          <Link
            href={PATHS.ROOM_DETAIL('101')}
            className='group relative mx-auto block w-full max-w-lg cursor-pointer lg:max-w-none'
          >
            {/* Background card grid */}
            <div className='absolute inset-0 -z-10 scale-102 -rotate-2 transform rounded-3xl bg-primary/5 transition-transform group-hover:rotate-0' />

            <div className='space-y-6 rounded-2xl border border-border bg-card p-6 shadow-xl transition-colors group-hover:border-primary/50'>
              {/* Mock Dashboard Header */}
              <div className='flex items-center justify-between border-b border-border pb-4'>
                <div>
                  <h3 className='text-base font-bold transition-colors group-hover:text-primary'>
                    Phòng 101 - Căn Hộ Homies
                  </h3>
                  <p className='text-xs text-muted-foreground'>4 thành viên • Xem chi tiết ➔</p>
                </div>
                <Button size='icon-sm' variant='outline' className='rounded-full'>
                  <Plus className='size-4' />
                </Button>
              </div>

              {/* Balance cards */}
              <div className='grid grid-cols-2 gap-4'>
                <Card accent='success' className='space-y-1 p-4'>
                  <span className='text-[10px] font-bold tracking-wider text-muted-foreground uppercase'>
                    Bạn được nhận
                  </span>
                  <p className='text-primary-fixed-dim text-lg font-bold text-secondary'>750.000 ₫</p>
                </Card>
                <Card accent='destructive' className='space-y-1 p-4'>
                  <span className='text-[10px] font-bold tracking-wider text-muted-foreground uppercase'>
                    Bạn cần trả
                  </span>
                  <p className='text-tertiary text-lg font-bold'>120.000 ₫</p>
                </Card>
              </div>

              {/* Active list of bills */}
              <div className='space-y-3'>
                <h4 className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>Giao dịch gần đây</h4>

                {/* Bill Item 1 */}
                <div className='flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50'>
                  <div className='flex items-center gap-3'>
                    <div className='flex size-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600'>
                      <Receipt className='size-4' />
                    </div>
                    <div>
                      <p className='text-sm font-semibold'>Tiền điện tháng 6</p>
                      <p className='text-[10px] text-muted-foreground'>Hôm qua • Người trả: Anh Tú</p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-bold'>1.200.000 ₫</p>
                    <Badge variant='success'>Đã chia đều</Badge>
                  </div>
                </div>

                {/* Bill Item 2 */}
                <div className='flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50'>
                  <div className='flex items-center gap-3'>
                    <div className='flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600'>
                      <Receipt className='size-4' />
                    </div>
                    <div>
                      <p className='text-sm font-semibold'>Đi chợ & Nước ngọt</p>
                      <p className='text-[10px] text-muted-foreground'>2 ngày trước • Người trả: Minh Thư</p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-bold'>450.000 ₫</p>
                    <Badge variant='warning'>Chờ bạn duyệt</Badge>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. Features Section */}
      <section id='features' className='mx-auto max-w-7xl px-6 py-16 md:py-24'>
        <div className='mx-auto mb-16 max-w-xl space-y-3 text-center'>
          <Badge variant='default'>Các tính năng cốt lõi</Badge>
          <h2 className='text-3xl font-bold tracking-tight'>Mọi công cụ bạn cần để quản lý tài chính nhóm</h2>
          <p className='text-sm font-light text-muted-foreground'>
            Chúng tôi xây dựng các tính năng giúp loại bỏ sự rắc rối và khó xử khi chia tiền.
          </p>
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
          <Card hoverable className='space-y-4'>
            <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary'>
              <Users className='size-5' />
            </div>
            <h3 className='text-base font-bold'>Tạo nhóm dễ dàng</h3>
            <p className='text-xs leading-relaxed text-muted-foreground'>
              Tạo phòng trọ, nhóm du lịch hay câu lạc bộ và mời các thành viên tham gia ngay qua link/mã QR.
            </p>
          </Card>

          <Card hoverable className='space-y-4'>
            <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary'>
              <Receipt className='size-5' />
            </div>
            <h3 className='text-base font-bold'>Chia lẻ theo món ăn</h3>
            <p className='text-xs leading-relaxed text-muted-foreground'>
              Không chỉ chia đều! Bạn có thể chọn ai ăn món nào để thanh toán chính xác, công bằng nhất.
            </p>
          </Card>

          <Card hoverable className='space-y-4'>
            <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary'>
              <BellRing className='size-5' />
            </div>
            <h3 className='text-base font-bold'>Nhắc nợ tinh tế</h3>
            <p className='text-xs leading-relaxed text-muted-foreground'>
              Hệ thống tự động gửi nhắc nhở nhẹ nhàng, văn minh mà không làm sứt mẻ tình cảm bạn bè.
            </p>
          </Card>

          <Card hoverable className='space-y-4'>
            <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary'>
              <FileText className='size-5' />
            </div>
            <h3 className='text-base font-bold'>Báo cáo trực quan</h3>
            <p className='text-xs leading-relaxed text-muted-foreground'>
              Tổng kết chi tiết thu chi hàng tháng của phòng trọ hoặc nhóm bằng biểu đồ dễ hiểu.
            </p>
          </Card>
        </div>
      </section>

      {/* 4. How it works Section */}
      <section id='how-it-works' className='border-t border-border bg-card/30 py-16 md:py-24'>
        <div className='mx-auto max-w-7xl px-6'>
          <div className='mx-auto mb-16 max-w-xl space-y-3 text-center'>
            <Badge variant='default'>Quy trình đơn giản</Badge>
            <h2 className='text-3xl font-bold tracking-tight'>Hoạt động như thế nào?</h2>
            <p className='text-sm font-light text-muted-foreground'>
              Chỉ với 3 bước đơn giản là bạn có thể giải quyết dứt điểm các khoản nợ nhóm.
            </p>
          </div>

          <div className='relative grid grid-cols-1 gap-12 md:grid-cols-3'>
            {/* Step 1 */}
            <div className='space-y-4 text-center'>
              <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white shadow-md'>
                1
              </div>
              <h3 className='text-lg font-bold'>Đăng ký & Tạo phòng</h3>
              <p className='mx-auto max-w-xs text-sm font-light text-muted-foreground'>
                Tạo tài khoản nhanh chóng và tạo phòng chia tiền (ví dụ: Phòng 402, Nhóm Phượt Đà Lạt).
              </p>
            </div>

            {/* Step 2 */}
            <div className='space-y-4 text-center'>
              <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white shadow-md'>
                2
              </div>
              <h3 className='text-lg font-bold'>Thêm thành viên & Giao dịch</h3>
              <p className='mx-auto max-w-xs text-sm font-light text-muted-foreground'>
                Mời mọi người vào phòng, sau đó bất kỳ ai chi tiêu khoản gì đều có thể chủ động nhập vào.
              </p>
            </div>

            {/* Step 3 */}
            <div className='space-y-4 text-center'>
              <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white shadow-md'>
                3
              </div>
              <h3 className='text-lg font-bold'>Hệ thống tự động chia & thanh toán</h3>
              <p className='mx-auto max-w-xs text-sm font-light text-muted-foreground'>
                Thuật toán thông minh sẽ tự động cấn trừ chéo và tính số tiền thực tế cần chuyển khoản.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA Section */}
      <section className='relative overflow-hidden border-t border-border bg-gradient-to-tr from-primary to-[#1e2e85] py-16 text-center text-primary-foreground md:py-20'>
        <div className='pointer-events-none absolute inset-0 z-0 bg-white/5 opacity-50' />
        <div className='relative z-10 mx-auto max-w-xl space-y-6 px-6'>
          <h2 className='text-3xl font-bold tracking-tight md:text-4xl'>Sẵn sàng dọn dẹp các khoản nợ lẻ?</h2>
          <p className='text-sm leading-relaxed font-light text-white/80 md:text-base'>
            Đăng ký tài khoản miễn phí ngay hôm nay và tạo căn phòng đầu tiên của bạn chỉ trong vòng 30 giây!
          </p>
          <Button
            size='lg'
            className='h-12 rounded-xl bg-white px-8 text-sm font-bold text-primary hover:bg-white/90'
            asChild
          >
            <Link href='/register'>Tạo tài khoản ngay</Link>
          </Button>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className='mt-auto border-t border-border bg-card py-12 text-sm text-muted-foreground transition-colors'>
        <div className='mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row'>
          <div className='flex items-center gap-2'>
            <div className='flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10'>
              <Wallet className='size-4.5 text-primary' />
            </div>
            <span className='text-base font-bold tracking-tight text-primary'>BillMates</span>
          </div>

          <div className='flex items-center gap-6'>
            <span className='cursor-pointer transition-colors hover:text-foreground'>Điều khoản dịch vụ</span>
            <span className='cursor-pointer transition-colors hover:text-foreground'>Chính sách bảo mật</span>
            <span className='cursor-pointer transition-colors hover:text-foreground'>Liên hệ</span>
          </div>

          <div className='text-xs text-muted-foreground/75'>
            © 2026 BillMates. Phát triển cho việc tối ưu hóa chi tiêu nhóm.
          </div>
        </div>
        <div className='mt-4 text-center text-[10px] text-muted-foreground/50'>
          Nhấn phím <kbd className='rounded border border-border bg-muted px-1 text-[9px]'>d</kbd> để chuyển đổi Giao
          diện Tối/Sáng.
        </div>
      </footer>
    </div>
  )
}
