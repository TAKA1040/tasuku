import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '燃費記録 - TASUKU',
  description: '給油記録を管理して燃費を追跡',
  icons: {
    icon: '/nenpi-icon.png',
    apple: '/nenpi-icon.png',
  },
}

export default function NenpiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
