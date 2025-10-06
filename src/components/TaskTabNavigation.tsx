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
      gap: '0',
      borderBottom: '2px solid var(--border-color)',
      marginBottom: '16px'
    }}>
      <Link
        href="/today"
        onClick={(e) => handleClick(e, '/today')}
        style={{
          padding: '12px 24px',
          textDecoration: 'none',
          color: pathname === '/today' ? 'var(--text-color)' : 'var(--text-secondary)',
          fontWeight: pathname === '/today' ? 'bold' : 'normal',
          borderBottom: pathname === '/today' ? '3px solid var(--primary-color)' : '3px solid transparent',
          marginBottom: '-2px',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
      >
        📅 今日のタスク
      </Link>
      <Link
        href="/inbox"
        onClick={(e) => handleClick(e, '/inbox')}
        style={{
          padding: '12px 24px',
          textDecoration: 'none',
          color: pathname === '/inbox' ? 'var(--text-color)' : 'var(--text-secondary)',
          fontWeight: pathname === '/inbox' ? 'bold' : 'normal',
          borderBottom: pathname === '/inbox' ? '3px solid var(--primary-color)' : '3px solid transparent',
          marginBottom: '-2px',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
      >
        📥 Inbox
      </Link>
    </div>
  )
}
