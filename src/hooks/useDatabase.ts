'use client'

// React Hook for database initialization
// NextAuth認証対応版
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { initializeDevFeatures } from '@/lib/features'
import { setupDevTools } from '@/lib/db/reset'
import { setupRecurringDevTools } from '@/lib/utils/recurring-test'
import { logger } from '@/lib/utils/logger'

export function useDatabase() {
  const { data: session, status } = useSession()
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') {
      if (process.env.NODE_ENV === 'development') {
        logger.info('Server side rendering detected, skipping initialization')
      }
      return
    }

    // Wait for session status to be determined
    if (status === 'loading') {
      return
    }

    // Check if user is authenticated via NextAuth
    if (!session?.user) {
      if (process.env.NODE_ENV === 'development') {
        logger.info('No authenticated user found (NextAuth), skipping initialization')
      }
      setIsInitialized(false)
      setError(null)
      return
    }

    let mounted = true

    async function init() {
      try {
        if (process.env.NODE_ENV === 'development') {
          logger.info('Starting initialization for user:', session?.user?.email)
        }

        await initializeDevFeatures()
        if (process.env.NODE_ENV === 'development') {
          logger.info('Dev features initialized')
        }

        setupDevTools()
        setupRecurringDevTools()
        if (process.env.NODE_ENV === 'development') {
          logger.info('Dev tools setup')
        }

        if (mounted) {
          setIsInitialized(true)
          if (process.env.NODE_ENV === 'development') {
            logger.info('Initialization completed successfully')
          }
        }
      } catch (err) {
        logger.error('Initialization failed:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          setIsInitialized(false)
        }
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [session, status])

  return { isInitialized, error }
}