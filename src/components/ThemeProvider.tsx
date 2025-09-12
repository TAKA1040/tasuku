'use client'

import { ThemeContext, useThemeLogic } from '@/hooks/useTheme'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeLogic = useThemeLogic()

  return (
    <ThemeContext.Provider value={themeLogic}>
      {children}
    </ThemeContext.Provider>
  )
}