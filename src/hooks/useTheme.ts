'use client'

import { useState, useEffect, createContext, useContext } from 'react'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeContextType {
  theme: Theme
  actualTheme: 'light' | 'dark'  // auto解決後の実際のテーマ
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function useThemeLogic() {
  const [theme, setThemeState] = useState<Theme>('auto')
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')

  // システムのダークモード設定を検出
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const updateActualTheme = () => {
      if (theme === 'auto') {
        setActualTheme(mediaQuery.matches ? 'dark' : 'light')
      } else {
        setActualTheme(theme)
      }
    }

    // 初期設定
    updateActualTheme()

    // システム設定変更監視
    mediaQuery.addEventListener('change', updateActualTheme)
    
    return () => mediaQuery.removeEventListener('change', updateActualTheme)
  }, [theme])

  // ローカルストレージからの読み込み
  useEffect(() => {
    const savedTheme = localStorage.getItem('tasuku-theme') as Theme
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      setThemeState(savedTheme)
    }
  }, [])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('tasuku-theme', newTheme)
    
    // 即座に反映
    if (newTheme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      setActualTheme(mediaQuery.matches ? 'dark' : 'light')
    } else {
      setActualTheme(newTheme)
    }
  }

  // HTMLのdata属性を設定（CSS用）
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', actualTheme)
  }, [actualTheme])

  return {
    theme,
    actualTheme,
    setTheme
  }
}