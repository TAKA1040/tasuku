// IndexedDB リセット用ユーティリティ（開発時のみ）

import { DB_NAME } from './schema'

/**
 * IndexedDBを完全に削除する（開発時のデバッグ用）
 */
export async function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Deleting IndexedDB database:', DB_NAME)
    
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME)
    
    deleteRequest.onsuccess = () => {
      console.log('Database deleted successfully')
      resolve()
    }
    
    deleteRequest.onerror = () => {
      console.error('Failed to delete database:', deleteRequest.error)
      reject(deleteRequest.error)
    }
    
    deleteRequest.onblocked = () => {
      console.warn('Database deletion blocked. Please close all tabs.')
    }
  })
}

/**
 * 開発者用：ブラウザのコンソールからDBをリセット
 */
export function setupDevTools() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // @ts-expect-error Development tools: Adding global function for debugging
    window.resetTasukuDB = async () => {
      await deleteDatabase()
      window.location.reload()
    }
    
    console.log('Development tools available: window.resetTasukuDB()')
  }
}