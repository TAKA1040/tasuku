'use client'

import Link from 'next/link'
import { TaskTabNavigation } from '@/components/TaskTabNavigation'
import { ThemedContainer } from '@/components/ThemedContainer'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AuthStatus } from '@/components/AuthStatus'

const toolItems = [
  {
    href: '/tools/nenpi',
    icon: '⛽',
    title: '燃費記録',
    description: '給油記録を管理して燃費を追跡',
    category: '記録',
    color: 'blue'
  }
  // 将来的にここに追加するツールの例
  // {
  //   href: '/tools/expenses',
  //   icon: '💰',
  //   title: '家計簿',
  //   description: '支出を管理して予算を追跡',
  //   category: '記録',
  //   color: 'green'
  // },
  // {
  //   href: '/tools/timer',
  //   icon: '⏱️',
  //   title: 'ポモドーロタイマー',
  //   description: '集中時間を管理して生産性向上',
  //   category: '生産性',
  //   color: 'red'
  // },
]

const getColorClasses = (color: string) => {
  const colors = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-950/50',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'bg-blue-100 dark:bg-blue-900',
      text: 'text-blue-600 dark:text-blue-400'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      hover: 'hover:bg-green-100 dark:hover:bg-green-950/50',
      border: 'border-green-200 dark:border-green-800',
      icon: 'bg-green-100 dark:bg-green-900',
      text: 'text-green-600 dark:text-green-400'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      hover: 'hover:bg-red-100 dark:hover:bg-red-950/50',
      border: 'border-red-200 dark:border-red-800',
      icon: 'bg-red-100 dark:bg-red-900',
      text: 'text-red-600 dark:text-red-400'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      hover: 'hover:bg-purple-100 dark:hover:bg-purple-950/50',
      border: 'border-purple-200 dark:border-purple-800',
      icon: 'bg-purple-100 dark:bg-purple-900',
      text: 'text-purple-600 dark:text-purple-400'
    }
  }
  return colors[color as keyof typeof colors] || colors.blue
}

export default function ToolsPage() {
  return (
    <ThemedContainer>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h1 className="dark:text-white" style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>
            TASUKU
          </h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <ThemeToggle />
            <AuthStatus />
          </div>
        </div>

        {/* Navigation Tabs */}
        <TaskTabNavigation />

        {/* Page Header */}
        <div style={{ marginTop: '32px', marginBottom: '32px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              🛠️
            </div>
            <div>
              <h2 className="dark:text-white" style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: 0
              }}>
                ツール
              </h2>
              <p className="dark:text-gray-400" style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: '4px 0 0 0'
              }}>
                日常を便利にするミニツール集
              </p>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {toolItems.map((tool) => {
            const colors = getColorClasses(tool.color)
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className={`block p-6 rounded-xl border-2 transition-all duration-200 shadow-sm hover:shadow-md ${colors.bg} ${colors.hover} ${colors.border}`}
              >
                <div style={{ marginBottom: '16px' }}>
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${colors.icon}`}>
                    <span style={{ fontSize: '24px' }}>{tool.icon}</span>
                  </div>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${colors.text}`} style={{
                    backgroundColor: 'currentColor',
                    color: 'white',
                    opacity: 0.9
                  }}>
                    {tool.category}
                  </span>
                </div>
                <h3 className="dark:text-white" style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '8px'
                }}>
                  {tool.title}
                </h3>
                <p className="dark:text-gray-400" style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  lineHeight: '1.5'
                }}>
                  {tool.description}
                </p>
              </Link>
            )
          })}
        </div>

        {/* Coming Soon Section */}
        <div className="mt-8 p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <h3 className="dark:text-white" style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              もっとツールを追加予定
            </h3>
            <p className="dark:text-gray-400" style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              今後も便利なツールを追加していきます
            </p>
          </div>
        </div>
      </div>
    </ThemedContainer>
  )
}
