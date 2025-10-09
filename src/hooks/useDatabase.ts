'use client'

// React Hook for database initialization
import { useState, useEffect } from 'react'
import { supabaseDb as db } from '@/lib/db/supabase-database'
import { initializeDevFeatures } from '@/lib/features'
import { setupDevTools } from '@/lib/db/reset'
import { setupRecurringDevTools } from '@/lib/utils/recurring-test'
import { UI_CONSTANTS } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'

export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    // Ensure we're on the client side before attempting Supabase operations
    if (typeof window === 'undefined') {
      if (process.env.NODE_ENV === 'development') {
        logger.info('Server side rendering detected, skipping database initialization')
      }
      return
    }

    let mounted = true
    
    async function init() {
      try {
        if (process.env.NODE_ENV === 'development') {
          logger.info('Starting database initialization...')
        }

        // Check if user is authenticated before initializing database
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          if (process.env.NODE_ENV === 'development') {
            logger.info('No authenticated user found, skipping database initialization')
          }
          if (mounted) {
            setIsInitialized(false)
            setError(null) // Clear any previous errors
          }
          return
        }

        // Initialize Supabase connection
        await db.init()
        if (process.env.NODE_ENV === 'development') {
          logger.info('Supabase Database initialized')
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

        // Development: Add dummy data if no tasks exist
        // Note: Auto-seeding disabled to prevent unwanted data regeneration
        // To manually add dummy data, use: window.seedDummyData() in console
        if (process.env.NODE_ENV === 'development') {
          if (process.env.NODE_ENV === 'development') {
            logger.info('Checking for dummy data... (auto-seeding disabled)')
          }
          const { checkDatabaseState, seedDummyData } = await import('@/lib/db/seed')
          const state = await checkDatabaseState()
          if (process.env.NODE_ENV === 'development') {
            logger.info('Database state:', state)
          }

          // Auto-seeding disabled - users can manually seed via console
          // if (state.tasks === 0) {
          //   await seedDummyData()
          //   if (process.env.NODE_ENV === 'development') {
          //     logger.info('Seeded dummy data for development')
          //   }
          // }

          // Make seedDummyData available globally for manual use
          if (typeof window !== 'undefined') {
            (window as Window & { seedDummyData?: typeof seedDummyData }).seedDummyData = seedDummyData
          }
        }

        if (mounted) {
          setIsInitialized(true)
          if (process.env.NODE_ENV === 'development') {
            logger.info('Database initialization completed successfully')
          }
        }
      } catch (err) {
        logger.error('Database initialization failed:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          setIsInitialized(false)
        }
      }
    }
    
    // Add a small delay to ensure the DOM is fully loaded
    const timeoutId = setTimeout(init, UI_CONSTANTS.DATABASE_INIT_RETRY_DELAY)
    
    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [])
  
  return { isInitialized, error, db }
}