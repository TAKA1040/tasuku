// IndexedDB Database Manager
// バージョニング対応とマイグレーション

import {
  DB_NAME,
  DB_VERSION,
  STORE_NAMES,
  INDEXES,
  type Settings,
  type Task,
  type RecurringTask,
  type RecurringLog,
  type LocationTag,
  type UnifiedItem
} from './schema'

// Re-export STORE_NAMES for convenience
export { STORE_NAMES }

class TasukuDatabase {
  private db: IDBDatabase | null = null
  
  async init(): Promise<void> {
    if (this.db) return // Already initialized
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => {
        reject(new Error('Failed to open database'))
      }
      
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        this.setupStores(db)
      }
    })
  }
  
  private setupStores(db: IDBDatabase): void {
    // Tasks store
    if (!db.objectStoreNames.contains(STORE_NAMES.TASKS)) {
      const taskStore = db.createObjectStore(STORE_NAMES.TASKS, { keyPath: 'id' })
      taskStore.createIndex(INDEXES.TASKS.BY_DUE_DATE, 'due_date')
      taskStore.createIndex(INDEXES.TASKS.BY_COMPLETED, 'completed')
      taskStore.createIndex(INDEXES.TASKS.BY_CREATED_AT, 'created_at')
    }
    
    // Recurring Tasks store
    if (!db.objectStoreNames.contains(STORE_NAMES.RECURRING_TASKS)) {
      const recurringStore = db.createObjectStore(STORE_NAMES.RECURRING_TASKS, { keyPath: 'id' })
      recurringStore.createIndex(INDEXES.RECURRING_TASKS.BY_ACTIVE, 'active')
      recurringStore.createIndex(INDEXES.RECURRING_TASKS.BY_START_DATE, 'start_date')
    }
    
    // Recurring Logs store
    if (!db.objectStoreNames.contains(STORE_NAMES.RECURRING_LOGS)) {
      const logStore = db.createObjectStore(STORE_NAMES.RECURRING_LOGS, { 
        keyPath: ['recurring_id', 'date'] 
      })
      logStore.createIndex(INDEXES.RECURRING_LOGS.BY_DATE, 'date')
      logStore.createIndex(INDEXES.RECURRING_LOGS.BY_RECURRING_ID, 'recurring_id')
    }
    
    // Settings store
    if (!db.objectStoreNames.contains(STORE_NAMES.SETTINGS)) {
      const settingsStore = db.createObjectStore(STORE_NAMES.SETTINGS, { keyPath: 'id' })
      
      // Initialize default settings within the upgrade transaction
      const defaultSettings: Settings = {
        id: 'main',
        timezone: 'Asia/Tokyo',
        urgency_thresholds: {
          soon: 3,
          next7: 7,
          next30: 30
        },
        features: {
          connectors_readonly: false,
          plan_suggestion: false,
          ml_ranking: false,
          geolocation: false
        },
        updated_at: new Date().toISOString()
      }
      
      settingsStore.put(defaultSettings)
    }
    
    // Location Tags store (PHASE 6)
    if (!db.objectStoreNames.contains(STORE_NAMES.LOCATION_TAGS)) {
      db.createObjectStore(STORE_NAMES.LOCATION_TAGS, { keyPath: 'id' })
    }
    
    // Unified Items store (PHASE 4)
    if (!db.objectStoreNames.contains(STORE_NAMES.UNIFIED_ITEMS)) {
      db.createObjectStore(STORE_NAMES.UNIFIED_ITEMS, { keyPath: ['source', 'source_id'] })
    }
  }
  
  // Generic CRUD operations
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    if (!this.db) throw new Error('Database not initialized')
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  
  async put<T>(storeName: string, item: T): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(item)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized')
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  
  async getAllByIndex<T>(storeName: string, indexName: string, key?: IDBValidKey): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized')
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const request = key !== undefined ? index.getAll(key) : index.getAll()
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  
  // Settings operations
  async getSettings(): Promise<Settings> {
    const settings = await this.get<Settings>(STORE_NAMES.SETTINGS, 'main')
    if (!settings) {
      throw new Error('Settings not found')
    }
    return settings
  }
  
  async updateSettings(updates: Partial<Settings>): Promise<void> {
    const current = await this.getSettings()
    const updated: Settings = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString()
    }
    await this.put(STORE_NAMES.SETTINGS, updated)
  }
}

// Singleton instance
export const db = new TasukuDatabase()

// Helper functions for common operations
export async function initializeDatabase(): Promise<void> {
  await db.init()
}