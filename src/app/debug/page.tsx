'use client'

import { useState, useEffect } from 'react'
import { useDatabase } from '@/hooks/useDatabase'
import { useTasks } from '@/hooks/useTasks'
import { useRecurringTasks } from '@/hooks/useRecurringTasks'

export default function DebugPage() {
  const { isInitialized, error } = useDatabase()
  const { loading: tasksLoading, tasks, error: tasksError } = useTasks(isInitialized)
  const { loading: recurringLoading, recurringTasks, error: recurringError } = useRecurringTasks(isInitialized)
  
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({})
  
  useEffect(() => {
    setDebugInfo({
      timestamp: new Date().toISOString(),
      isInitialized,
      error,
      tasksLoading,
      tasksCount: tasks.length,
      tasksError,
      recurringLoading,
      recurringCount: recurringTasks.length,
      recurringError
    })
  }, [isInitialized, error, tasksLoading, tasks.length, tasksError, recurringLoading, recurringTasks.length, recurringError])

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Debug Page</h1>
      
      <h2>Database Status</h2>
      <div style={{ background: '#f5f5f5', padding: '10px', marginBottom: '20px' }}>
        <div>Initialized: {String(isInitialized)}</div>
        <div>Error: {error || 'None'}</div>
      </div>

      <h2>Tasks Hook Status</h2>
      <div style={{ background: '#f5f5f5', padding: '10px', marginBottom: '20px' }}>
        <div>Loading: {String(tasksLoading)}</div>
        <div>Count: {tasks.length}</div>
        <div>Error: {tasksError || 'None'}</div>
      </div>

      <h2>Recurring Tasks Hook Status</h2>
      <div style={{ background: '#f5f5f5', padding: '10px', marginBottom: '20px' }}>
        <div>Loading: {String(recurringLoading)}</div>
        <div>Count: {recurringTasks.length}</div>
        <div>Error: {recurringError || 'None'}</div>
      </div>

      <h2>Debug Info</h2>
      <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
      
      <h2>Tasks Data</h2>
      <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto', maxHeight: '300px' }}>
        {JSON.stringify(tasks, null, 2)}
      </pre>
    </div>
  )
}