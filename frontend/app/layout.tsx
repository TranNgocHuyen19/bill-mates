import { Geist_Mono, Be_Vietnam_Pro } from 'next/font/google'

import { Toaster } from 'sonner'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from '@/components/query-provider'
import { cn } from '@/lib/utils'

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans'
})

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono'
})

import { BottomNav } from '@/components/bottom-nav'

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang='vi'
      suppressHydrationWarning
      className={cn('antialiased', fontMono.variable, 'font-sans', beVietnamPro.variable)}
    >
      <body className='min-h-screen pb-24 md:pb-0'>
        <QueryProvider>
          <ThemeProvider>
            {children}
            <BottomNav />
            <Toaster richColors position='top-right' />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
