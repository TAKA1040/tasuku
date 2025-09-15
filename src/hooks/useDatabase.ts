'use client'

// React Hook for database initialization
import { useState, useEffect } from 'react'
import { supabaseDb as db } from '@/lib/db/supabase-database'
import { initializeDevFeatures } from '@/lib/features'
import { setupDevTools } from '@/lib/db/reset'
import { setupRecurringDevTools } from '@/lib/utils/recurring-test'

export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    // Ensure we're on the client side before attempting Supabase operations
    if (typeof window === 'undefined') {
      console.log('Server side rendering detected, skipping database initialization')
      return
    }

    let mounted = true
    
    async function init() {
      try {
        console.log('Starting database initialization...')

        // Check if user is authenticated before initializing database
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          console.log('No authenticated user found, skipping database initialization')
          if (mounted) {
            setIsInitialized(false)
            setError(null) // Clear any previous errors
          }
          return
        }

        // Initialize Supabase connection
        await db.init()
        console.log('Supabase Database initialized')

        await initializeDevFeatures()
        console.log('Dev features initialized')

        setupDevTools()
        setupRecurringDevTools()
        console.log('Dev tools setup')

        // Development: Add dummy data if no tasks exist
        if (process.env.NODE_ENV === 'development') {
          console.log('Checking for dummy data...')
          const { checkDatabaseState, seedDummyData } = await import('@/lib/db/seed')
          const state = await checkDatabaseState()
          console.log('Database state:', state)
          if (state.tasks === 0) {
            await seedDummyData()
            console.log('Seeded dummy data for development')
          }
        }

        if (mounted) {
          setIsInitialized(true)
          console.log('Database initialization completed successfully')
        }
      } catch (err) {
        console.error('Database initialization failed:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          setIsInitialized(false)
        }
      }
    }
    
    // Add a small delay to ensure the DOM is fully loaded
    const timeoutId = setTimeout(init, 100)
    
    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [])
  
  return { isInitialized, error, db }
}