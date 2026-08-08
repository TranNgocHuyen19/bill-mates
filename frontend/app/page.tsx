import Link from 'next/link'
import {
  Wallet,
  ArrowRight,
  Plus,
  Users,
  Receipt,
  BellRing,
  CheckCircle,
  HelpCircle,
  FileText,
  UserCheck
} from 'lucide-react'

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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      {/* 1. Dynamic Header Navbar with Auth state */}
      <Navbar />


      {/* 2. Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        {/* Decorative ambient background */}
        <div className="absolute top-[20%] right-[-10%] w-[350px] h-[350px] rounded-full bg-primary/10 blur-3xl -z-10" />
        <div className="absolute bottom-[10%] left-[-10%] w-[250px] h-[250px] rounded-full bg-secondary/10 blur-2xl -z-10" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Hero Left Column */}
          <div className="space-y-6 text-center lg:text-left">
            <Badge variant="default" className="py-1 px-3">
              🎉 Trải nghiệm BillMates hoàn toàn mới
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
              Chia tiền thông minh,<br className="hidden md:inline" />
              <span className="text-primary">giữ gìn hòa khí.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed font-light">
              Giải pháp tối ưu xóa tan sự ngại ngùng khi chia tiền nhà, tiền ăn uống cùng bạn bè hay đồng nghiệp. Tính toán tự động, chính xác đến từng đồng.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button size="lg" className="h-12 px-6 text-sm font-semibold w-full sm:w-auto" asChild>
                <Link href={PATHS.AUTH.REGISTER}>
                  Bắt đầu miễn phí <ArrowRight className="size-4 ml-1" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-6 text-sm font-semibold w-full sm:w-auto" asChild>
                <a href="#how-it-works">Xem cách hoạt động</a>
              </Button>
            </div>
            <div className="flex justify-center lg:justify-start gap-6 pt-4 text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1"><CheckCircle className="size-3.5 text-secondary" /> Không cần cài đặt app</span>
              <span className="flex items-center gap-1"><CheckCircle className="size-3.5 text-secondary" /> Hỗ trợ quét hóa đơn AI</span>
            </div>
          </div>

          {/* Hero Right Column: Interactive Stitch Style Mockup */}
          <Link href={PATHS.ROOM_DETAIL('101')} className="relative w-full max-w-lg mx-auto lg:max-w-none block group cursor-pointer">
            {/* Background card grid */}
            <div className="absolute inset-0 bg-primary/5 rounded-3xl -rotate-2 transform scale-102 -z-10 group-hover:rotate-0 transition-transform" />

            <div className="bg-card border border-border rounded-2xl shadow-xl p-6 space-y-6 group-hover:border-primary/50 transition-colors">
              {/* Mock Dashboard Header */}
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <div>
                  <h3 className="font-bold text-base group-hover:text-primary transition-colors">Phòng 101 - Căn Hộ Homies</h3>
                  <p className="text-xs text-muted-foreground">4 thành viên • Xem chi tiết ➔</p>
                </div>
                <Button size="icon-sm" variant="outline" className="rounded-full">
                  <Plus className="size-4" />
                </Button>
              </div>

              {/* Balance cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card accent="success" className="p-4 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Bạn được nhận</span>
                  <p className="text-lg font-bold text-secondary text-primary-fixed-dim">750.000 ₫</p>
                </Card>
                <Card accent="destructive" className="p-4 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Bạn cần trả</span>
                  <p className="text-lg font-bold text-tertiary">120.000 ₫</p>
                </Card>
              </div>

              {/* Active list of bills */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Giao dịch gần đây</h4>
                
                {/* Bill Item 1 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
                      <Receipt className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Tiền điện tháng 6</p>
                      <p className="text-[10px] text-muted-foreground">Hôm qua • Người trả: Anh Tú</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">1.200.000 ₫</p>
                    <Badge variant="success">Đã chia đều</Badge>
                  </div>
                </div>

                {/* Bill Item 2 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                      <Receipt className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Đi chợ & Nước ngọt</p>
                      <p className="text-[10px] text-muted-foreground">2 ngày trước • Người trả: Minh Thư</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">450.000 ₫</p>
                    <Badge variant="warning">Chờ bạn duyệt</Badge>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. Features Section */}
      <section id="features" className="py-16 md:py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
          <Badge variant="default">Các tính năng cốt lõi</Badge>
          <h2 className="text-3xl font-bold tracking-tight">Mọi công cụ bạn cần để quản lý tài chính nhóm</h2>
          <p className="text-muted-foreground text-sm font-light">
            Chúng tôi xây dựng các tính năng giúp loại bỏ sự rắc rối và khó xử khi chia tiền.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card hoverable className="space-y-4">
            <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Users className="size-5" />
            </div>
            <h3 className="font-bold text-base">Tạo nhóm dễ dàng</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tạo phòng trọ, nhóm du lịch hay câu lạc bộ và mời các thành viên tham gia ngay qua link/mã QR.
            </p>
          </Card>

          <Card hoverable className="space-y-4">
            <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Receipt className="size-5" />
            </div>
            <h3 className="font-bold text-base">Chia lẻ theo món ăn</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Không chỉ chia đều! Bạn có thể chọn ai ăn món nào để thanh toán chính xác, công bằng nhất.
            </p>
          </Card>

          <Card hoverable className="space-y-4">
            <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <BellRing className="size-5" />
            </div>
            <h3 className="font-bold text-base">Nhắc nợ tinh tế</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hệ thống tự động gửi nhắc nhở nhẹ nhàng, văn minh mà không làm sứt mẻ tình cảm bạn bè.
            </p>
          </Card>

          <Card hoverable className="space-y-4">
            <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <FileText className="size-5" />
            </div>
            <h3 className="font-bold text-base">Báo cáo trực quan</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tổng kết chi tiết thu chi hàng tháng của phòng trọ hoặc nhóm bằng biểu đồ dễ hiểu.
            </p>
          </Card>
        </div>
      </section>

      {/* 4. How it works Section */}
      <section id="how-it-works" className="py-16 md:py-24 border-t border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
            <Badge variant="default">Quy trình đơn giản</Badge>
            <h2 className="text-3xl font-bold tracking-tight">Hoạt động như thế nào?</h2>
            <p className="text-muted-foreground text-sm font-light">
              Chỉ với 3 bước đơn giản là bạn có thể giải quyết dứt điểm các khoản nợ nhóm.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="space-y-4 text-center">
              <div className="size-12 rounded-full bg-primary text-white font-bold text-lg flex items-center justify-center mx-auto shadow-md">
                1
              </div>
              <h3 className="font-bold text-lg">Đăng ký & Tạo phòng</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto font-light">
                Tạo tài khoản nhanh chóng và tạo phòng chia tiền (ví dụ: Phòng 402, Nhóm Phượt Đà Lạt).
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 text-center">
              <div className="size-12 rounded-full bg-primary text-white font-bold text-lg flex items-center justify-center mx-auto shadow-md">
                2
              </div>
              <h3 className="font-bold text-lg">Thêm thành viên & Giao dịch</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto font-light">
                Mời mọi người vào phòng, sau đó bất kỳ ai chi tiêu khoản gì đều có thể chủ động nhập vào.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 text-center">
              <div className="size-12 rounded-full bg-primary text-white font-bold text-lg flex items-center justify-center mx-auto shadow-md">
                3
              </div>
              <h3 className="font-bold text-lg">Hệ thống tự động chia & thanh toán</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto font-light">
                Thuật toán thông minh sẽ tự động cấn trừ chéo và tính số tiền thực tế cần chuyển khoản.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA Section */}
      <section className="py-16 md:py-20 border-t border-border bg-gradient-to-tr from-primary to-[#1e2e85] text-primary-foreground text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 opacity-50 z-0 pointer-events-none" />
        <div className="relative z-10 max-w-xl mx-auto space-y-6 px-6">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Sẵn sàng dọn dẹp các khoản nợ lẻ?</h2>
          <p className="text-white/80 text-sm md:text-base font-light leading-relaxed">
            Đăng ký tài khoản miễn phí ngay hôm nay và tạo căn phòng đầu tiên của bạn chỉ trong vòng 30 giây!
          </p>
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-12 px-8 font-bold text-sm rounded-xl" asChild>
            <Link href="/register">Tạo tài khoản ngay</Link>
          </Button>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-border bg-card mt-auto py-12 text-sm text-muted-foreground transition-colors">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
              <Wallet className="size-4.5 text-primary" />
            </div>
            <span className="font-bold text-base tracking-tight text-primary">BillMates</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="hover:text-foreground cursor-pointer transition-colors">Điều khoản dịch vụ</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Chính sách bảo mật</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Liên hệ</span>
          </div>

          <div className="text-xs text-muted-foreground/75">
            © 2026 BillMates. Phát triển cho việc tối ưu hóa chi tiêu nhóm.
          </div>
        </div>
        <div className="text-center text-[10px] text-muted-foreground/50 mt-4">
          Nhấn phím <kbd className="border border-border rounded px-1 text-[9px] bg-muted">d</kbd> để chuyển đổi Giao diện Tối/Sáng.
        </div>
      </footer>
    </div>
  )
}
