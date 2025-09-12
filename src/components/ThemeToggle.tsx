'use client'

import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
  const { theme, actualTheme, setTheme } = useTheme()

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return '☀️'
      case 'dark': return '🌙'
      case 'auto': return actualTheme === 'dark' ? '🌙' : '☀️'
      default: return '☀️'
    }
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'ライト'
      case 'dark': return 'ダーク'
      case 'auto': return 'オート'
      default: return 'ライト'
    }
  }

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'auto'] as const
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  return (
    <button
      onClick={cycleTheme}
      style={{
        background: actualTheme === 'dark' ? '#374151' : '#f3f4f6',
        color: actualTheme === 'dark' ? '#f9fafb' : '#1f2937',
        border: `1px solid ${actualTheme === 'dark' ? '#4b5563' : '#d1d5db'}`,
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '12px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.2s ease'
      }}
      title={`現在: ${getThemeLabel()}モード (クリックで切り替え)`}
    >
      {getThemeIcon()} {getThemeLabel()}
    </button>
  )
}