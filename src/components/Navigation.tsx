'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/today', label: '今日', icon: '📅' },
  { href: '/manage', label: '管理', icon: '⚙️' },
  { href: '/stats', label: '統計', icon: '📊' }
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav style={{
      backgroundColor: '#fff',
      borderBottom: '1px solid #e5e7eb',
      padding: '0 20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '60px'
      }}>
        <Link 
          href="/today" 
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            textDecoration: 'none',
            color: '#1f2937'
          }}
        >
          Tasuku
        </Link>

        <div style={{ display: 'flex', gap: '8px' }}>
          {navItems.map(({ href, label, icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#2563eb' : '#6b7280',
                  transition: 'all 0.2s'
                }}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}