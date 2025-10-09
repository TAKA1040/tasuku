// 統一エラーハンドリングシステム
// アプリケーション全体で一貫したエラー処理を提供

import { logger } from '@/lib/utils/logger'

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface AppError {
  message: string
  severity: ErrorSeverity
  code?: string
  originalError?: unknown
  timestamp: string
}

// エラーメッセージの統一
export const ERROR_MESSAGES = {
  // データベース関連
  DB_CONNECTION_FAILED: 'データベースへの接続に失敗しました',
  DB_OPERATION_FAILED: 'データベース操作に失敗しました',
  DATA_LOAD_FAILED: 'データの読み込みに失敗しました',
  DATA_SAVE_FAILED: 'データの保存に失敗しました',

  // 認証関連
  AUTH_FAILED: '認証に失敗しました',
  AUTH_REQUIRED: 'ログインが必要です',
  PERMISSION_DENIED: '操作する権限がありません',

  // タスク操作関連
  TASK_CREATE_FAILED: 'タスクの作成に失敗しました',
  TASK_UPDATE_FAILED: 'タスクの更新に失敗しました',
  TASK_DELETE_FAILED: 'タスクの削除に失敗しました',
  TASK_COMPLETE_FAILED: 'タスクの完了処理に失敗しました',

  // 一般的なエラー
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  VALIDATION_ERROR: '入力内容に問題があります',
  UNEXPECTED_ERROR: '予期しないエラーが発生しました',
  FILE_OPERATION_FAILED: 'ファイル操作に失敗しました'
} as const

// エラーの種類を判定
export function categorizeError(error: unknown): ErrorSeverity {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // 認証エラーは高優先度
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'high'
    }

    // ネットワークエラーは中優先度
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'medium'
    }

    // データベースエラーは高優先度
    if (message.includes('database') || message.includes('sql') || message.includes('supabase')) {
      return 'high'
    }
  }

  return 'medium' // デフォルト
}

// エラーメッセージを統一形式で取得
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // 特定のエラーパターンをチェック
    const message = error.message.toLowerCase()

    if (message.includes('auth')) return ERROR_MESSAGES.AUTH_FAILED
    if (message.includes('network') || message.includes('fetch')) return ERROR_MESSAGES.NETWORK_ERROR
    if (message.includes('permission') || message.includes('forbidden')) return ERROR_MESSAGES.PERMISSION_DENIED
    if (message.includes('database') || message.includes('supabase')) return ERROR_MESSAGES.DB_OPERATION_FAILED

    // 具体的なエラーメッセージがある場合はそのまま使用
    if (error.message && error.message.length > 0) {
      return error.message
    }
  }

  if (typeof error === 'string') {
    return error
  }

  return ERROR_MESSAGES.UNEXPECTED_ERROR
}

// 統一エラーハンドリング関数
export function handleError(
  error: unknown,
  context: string,
  setError?: (message: string) => void,
  severity: ErrorSeverity = 'medium'
): AppError {
  const appError: AppError = {
    message: getErrorMessage(error),
    severity: severity || categorizeError(error),
    originalError: error,
    timestamp: new Date().toISOString()
  }

  // 開発環境でのみ詳細ログを出力
  if (process.env.NODE_ENV === 'development') {
    logger.error(`[${context}] ${appError.severity.toUpperCase()}:`, {
      message: appError.message,
      originalError: error,
      timestamp: appError.timestamp
    })
  } else {
    // 本番環境では重要度が高いエラーのみログ出力
    if (appError.severity === 'high' || appError.severity === 'critical') {
      logger.error(`[${context}] ${appError.severity.toUpperCase()}:`, appError.message)
    }
  }

  // UIにエラーメッセージを設定
  if (setError) {
    setError(appError.message)
  }

  return appError
}

// 非同期操作用のエラーハンドリングヘルパー
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  setError?: (message: string) => void,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    return await operation()
  } catch (error) {
    handleError(error, context, setError)
    return fallbackValue
  }
}

// React Hook用のエラー状態管理
export interface UseErrorState {
  error: string | null
  setError: (message: string | null) => void
  clearError: () => void
  hasError: boolean
}

// エラー重要度に応じたスタイル
export function getErrorStyles(severity: ErrorSeverity) {
  switch (severity) {
    case 'low':
      return {
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b',
        textColor: '#92400e'
      }
    case 'medium':
      return {
        backgroundColor: '#fef2f2',
        borderColor: '#f87171',
        textColor: '#b91c1c'
      }
    case 'high':
      return {
        backgroundColor: '#fef2f2',
        borderColor: '#dc2626',
        textColor: '#991b1b'
      }
    case 'critical':
      return {
        backgroundColor: '#7f1d1d',
        borderColor: '#991b1b',
        textColor: '#ffffff'
      }
    default:
      return {
        backgroundColor: '#f3f4f6',
        borderColor: '#6b7280',
        textColor: '#374151'
      }
  }
}