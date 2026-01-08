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
  },
  {
    href: '/tools/label-maker',
    icon: '🏷️',
    title: 'シール職人',
    description: 'A4シール用紙に印刷できるラベル作成',
    category: '印刷',
    color: 'purple'
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

// 将来のツール拡張用にカラークラス取得関数を定義（現在未使用）
const _getColorClasses = (color: string) => {
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
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%)',
        paddingBottom: '60px'
      }}>
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
          <div style={{
            marginTop: '48px',
            marginBottom: '48px',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)'
              }}>
                🛠️
              </div>
            </div>
            <h2 className="dark:text-white" style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: '0 0 12px 0'
            }}>
              ツール
            </h2>
            <p className="dark:text-gray-400" style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: 0
            }}>
              日常を便利にするミニツール集
            </p>
          </div>

          {/* Tools Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '40px',
            maxWidth: '900px',
            margin: '0 auto 40px auto'
          }}>
            {toolItems.map((tool) => {
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    padding: '32px',
                    background: 'white',
                    borderRadius: '24px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    textDecoration: 'none'
                  }}
                  className="hover:shadow-xl hover:-translate-y-1"
                >
                  {/* アイコン - 左側 */}
                  <div style={{
                    width: '80px',
                    height: '80px',
                    minWidth: '80px',
                    background: tool.color === 'purple'
                      ? 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)'
                      : 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: tool.color === 'purple'
                      ? '0 4px 12px rgba(139, 92, 246, 0.3)'
                      : '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}>
                    {tool.href === '/tools/nenpi' ? (
                      <img src="/nenpi-icon.png" alt="燃費記録" style={{ width: '50px', height: '50px' }} />
                    ) : (
                      <span style={{ fontSize: '40px' }}>{tool.icon}</span>
                    )}
                  </div>

                  {/* タイトルと説明 - 右側 */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '22px',
                      fontWeight: '700',
                      color: '#1f2937',
                      marginBottom: '8px'
                    }}>
                      {tool.title}
                    </h3>
                    <p style={{
                      fontSize: '15px',
                      color: '#6b7280',
                      lineHeight: '1.6',
                      margin: 0
                    }}>
                      {tool.description}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Coming Soon Section */}
          <div style={{
            padding: '48px 32px',
            borderRadius: '24px',
            border: '2px dashed #cbd5e1',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            textAlign: 'center',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
              borderRadius: '20px',
              fontSize: '48px',
              marginBottom: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}>
              📦
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '12px'
            }}>
              もっとツールを追加予定
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              今後も便利なツールを追加していきます。<br />
              お楽しみに！
            </p>
          </div>
        </div>
      </div>
    </ThemedContainer>
  )
}
