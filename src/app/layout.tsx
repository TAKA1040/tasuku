export const metadata = {
  title: 'TASUKU - 予定管理ツール',
  description: 'シンプルな日次タスク管理',
  icons: {
    icon: '/favicon.svg'
  }
}

// Disable static optimization for all pages to prevent Supabase client issues during build
export const dynamic = 'force-dynamic'

import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body style={{
        margin: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        overflowX: 'hidden'
      }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
