'use client'

import { useState, useEffect } from 'react'

export default function TestDbPage() {
  const [log, setLog] = useState<string[]>([])
  
  const addLog = (message: string) => {
    console.log(message)
    setLog(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  useEffect(() => {
    const testIndexedDB = async () => {
      addLog('Testing IndexedDB availability...')
      
      // Check if IndexedDB is available
      if (!('indexedDB' in window)) {
        addLog('ERROR: IndexedDB not available')
        return
      }
      
      addLog('IndexedDB is available')
      
      try {
        addLog('Attempting to open test database...')
        const request = indexedDB.open('TestDB', 1)
        
        request.onerror = (event) => {
          addLog(`ERROR: Failed to open database - ${(event.target as IDBRequest)?.error}`)
        }
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBRequest).result as IDBDatabase
          addLog(`SUCCESS: Test database opened - ${db.name} v${db.version}`)
          db.close()
        }
        
        request.onupgradeneeded = (event) => {
          addLog('Database upgrade needed - creating test store')
          const db = (event.target as IDBRequest).result as IDBDatabase
          db.createObjectStore('testStore', { keyPath: 'id' })
          addLog('Test store created')
        }
      } catch (error) {
        addLog(`ERROR: Exception during database test - ${error}`)
      }
    }
    
    testIndexedDB()
  }, [])

  const testTasukuDatabase = async () => {
    addLog('Testing TasukuDB initialization...')
    
    try {
      const { initializeDatabase } = await import('@/lib/db/database')
      await initializeDatabase()
      addLog('SUCCESS: TasukuDB initialized successfully')
    } catch (error) {
      addLog(`ERROR: TasukuDB initialization failed - ${error}`)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Database Test Page</h1>
      
      <button onClick={testTasukuDatabase} style={{ marginBottom: '20px', padding: '10px' }}>
        Test TasukuDB Initialization
      </button>
      
      <h2>Log</h2>
      <div style={{ background: '#f5f5f5', padding: '10px', maxHeight: '400px', overflow: 'auto' }}>
        {log.map((entry, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            {entry}
          </div>
        ))}
      </div>
    </div>
  )
}