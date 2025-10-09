// IndexedDB リセット用ユーティリティ（開発時のみ）

import { DB_NAME } from './schema'
import { logger } from '@/lib/utils/logger'

/**
 * IndexedDBを完全に削除する（開発時のデバッグ用）
 */
export async function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (process.env.NODE_ENV === 'development') {
      logger.info('Deleting IndexedDB database:', DB_NAME)
    }
    
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME)
    
    deleteRequest.onsuccess = () => {
      if (process.env.NODE_ENV === 'development') {
        logger.info('Database deleted successfully')
      }
      resolve()
    }
    
    deleteRequest.onerror = () => {
      logger.error('Failed to delete database:', deleteRequest.error)
      reject(deleteRequest.error)
    }
    
    deleteRequest.onblocked = () => {
      logger.warn('Database deletion blocked. Please close all tabs.')
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
    
    if (process.env.NODE_ENV === 'development') {
      logger.info('Development tools available: window.resetTasukuDB()')
    }
  }
}