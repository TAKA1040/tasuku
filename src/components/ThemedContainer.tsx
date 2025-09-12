'use client'

import { useTheme } from '@/hooks/useTheme'
import { CSSProperties, ReactNode } from 'react'

interface ThemedContainerProps {
  children: ReactNode
  style?: CSSProperties
  className?: string
}

export function ThemedContainer({ children, style = {}, className }: ThemedContainerProps) {
  const { actualTheme } = useTheme()

  const baseStyle: CSSProperties = {
    backgroundColor: actualTheme === 'dark' ? '#1f2937' : '#f8fafc',
    color: actualTheme === 'dark' ? '#f9fafb' : '#1f2937',
    minHeight: '100vh',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    ...style
  }

  return (
    <div style={baseStyle} className={className}>
      {children}
    </div>
  )
}

// テーマ対応のカード/パネルスタイル
export function getThemedCardStyle(actualTheme: 'light' | 'dark'): CSSProperties {
  return {
    backgroundColor: actualTheme === 'dark' ? '#374151' : '#ffffff',
    color: actualTheme === 'dark' ? '#f9fafb' : '#1f2937',
    border: `1px solid ${actualTheme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
    transition: 'all 0.2s ease'
  }
}

// テーマ対応の入力フィールドスタイル
export function getThemedInputStyle(actualTheme: 'light' | 'dark'): CSSProperties {
  return {
    backgroundColor: actualTheme === 'dark' ? '#4b5563' : '#ffffff',
    color: actualTheme === 'dark' ? '#f9fafb' : '#1f2937',
    border: `1px solid ${actualTheme === 'dark' ? '#6b7280' : '#d1d5db'}`,
    transition: 'all 0.2s ease'
  }
}

// テーマ対応のボタンスタイル
export function getThemedButtonStyle(actualTheme: 'light' | 'dark', variant: 'primary' | 'secondary' | 'danger' = 'primary'): CSSProperties {
  const base = {
    transition: 'all 0.2s ease',
    border: 'none',
    cursor: 'pointer'
  }

  switch (variant) {
    case 'primary':
      return {
        ...base,
        backgroundColor: actualTheme === 'dark' ? '#3b82f6' : '#3b82f6',
        color: '#ffffff'
      }
    case 'secondary':
      return {
        ...base,
        backgroundColor: actualTheme === 'dark' ? '#4b5563' : '#f3f4f6',
        color: actualTheme === 'dark' ? '#f9fafb' : '#1f2937',
        border: `1px solid ${actualTheme === 'dark' ? '#6b7280' : '#d1d5db'}`
      }
    case 'danger':
      return {
        ...base,
        backgroundColor: actualTheme === 'dark' ? '#dc2626' : '#dc2626',
        color: '#ffffff'
      }
    default:
      return base
  }
}