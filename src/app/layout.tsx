export const metadata = {
  title: 'TASUKU - 予定管理ツール',
    manifest: '/manifest.json',
  icons: {\n    icon: [\n      { url: '/favicon.ico', type: 'image/x-icon' },\n      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },\n      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }\n    ],\n    apple: [\n      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }\n    ],\n    shortcut: '/favicon.ico'\n  }
}

export const viewport = 'width=device-width, initial-scale=1'

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
