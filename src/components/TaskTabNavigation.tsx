'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface TaskTabNavigationProps {
  onBeforeNavigate?: () => Promise<void>
}

export function TaskTabNavigation({ onBeforeNavigate }: TaskTabNavigationProps = {}) {
  const pathname = usePathname()

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>, targetPath: string) => {
    // 同じページへの遷移は無視
    if (pathname === targetPath) {
      e.preventDefault()
      return
    }

    // 遷移前の処理がある場合は実行
    if (onBeforeNavigate) {
      e.preventDefault()
      await onBeforeNavigate()
      // 処理完了後に遷移
      window.location.href = targetPath
    }
  }

  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      marginBottom: '16px',
      borderBottom: '1px solid #e5e7eb',
      paddingBottom: '0'
    }}>
      <Link
        href="/today"
        onClick={(e) => handleClick(e, '/today')}
        style={{
          padding: '10px 20px',
          textDecoration: 'none',
          color: pathname === '/today' ? '#3b82f6' : '#6b7280',
          fontWeight: pathname === '/today' ? '600' : '500',
          fontSize: '15px',
          background: pathname === '/today' ? '#eff6ff' : 'transparent',
          border: pathname === '/today' ? '1px solid #3b82f6' : '1px solid transparent',
          borderBottom: pathname === '/today' ? '1px solid #eff6ff' : '1px solid transparent',
          borderRadius: '8px 8px 0 0',
          marginBottom: '-1px',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          position: 'relative' as const,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        📅 今日のタスク
      </Link>
      <Link
        href="/inbox"
        onClick={(e) => handleClick(e, '/inbox')}
        style={{
          padding: '10px 20px',
          textDecoration: 'none',
          color: pathname === '/inbox' ? '#3b82f6' : '#6b7280',
          fontWeight: pathname === '/inbox' ? '600' : '500',
          fontSize: '15px',
          background: pathname === '/inbox' ? '#eff6ff' : 'transparent',
          border: pathname === '/inbox' ? '1px solid #3b82f6' : '1px solid transparent',
          borderBottom: pathname === '/inbox' ? '1px solid #eff6ff' : '1px solid transparent',
          borderRadius: '8px 8px 0 0',
          marginBottom: '-1px',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          position: 'relative' as const,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        📥 Inbox
      </Link>
    </div>
  )
}
