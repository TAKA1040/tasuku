// Unified error and user messages in Japanese

export const ERROR_MESSAGES = {
  // Authentication errors
  AUTH_REQUIRED: '認証が必要です。ログインしてください。',
  AUTH_FAILED: 'ログインに失敗しました。',
  OAUTH_ERROR: 'Google認証でエラーが発生しました。再試行してください。',
  
  // Database errors
  DB_INIT_FAILED: 'データベースの初期化に失敗しました。',
  DB_CONNECTION_ERROR: 'データベースに接続できません。',
  DB_NOT_INITIALIZED: 'データベースが初期化されていません。',
  
  // Task operation errors
  TASK_NOT_FOUND: 'タスクが見つかりません。',
  TASK_CREATE_FAILED: 'タスクの作成に失敗しました。',
  TASK_UPDATE_FAILED: 'タスクの更新に失敗しました。',
  TASK_DELETE_FAILED: 'タスクの削除に失敗しました。',
  TASK_COMPLETE_FAILED: 'タスクの完了処理に失敗しました。',
  TASK_MOVE_FAILED: 'タスクの移動に失敗しました。',
  
  // Recurring task errors
  RECURRING_TASK_NOT_FOUND: '繰り返しタスクが見つかりません。',
  RECURRING_TASK_CREATE_FAILED: '繰り返しタスクの作成に失敗しました。',
  RECURRING_TASK_UPDATE_FAILED: '繰り返しタスクの更新に失敗しました。',
  RECURRING_TASK_DELETE_FAILED: '繰り返しタスクの削除に失敗しました。',
  RECURRING_TASK_COMPLETE_FAILED: '繰り返しタスクの完了処理に失敗しました。',
  
  // Speech recognition errors
  SPEECH_RECOGNITION_ERROR: '音声認識エラーが発生しました。',
  SPEECH_RECOGNITION_START_FAILED: '音声認識を開始できませんでした。',
  
  // Generic errors
  UNKNOWN_ERROR: '予期しないエラーが発生しました。',
  NETWORK_ERROR: 'ネットワークエラーが発生しました。',
  PERMISSION_DENIED: '権限がありません。',
  
  // Feature not available errors
  FEATURE_NOT_IMPLEMENTED: 'この機能は現在実装されていません。',
  LOCATION_TAGS_NOT_IMPLEMENTED: 'ロケーションタグ機能は実装されていません。',
  UNIFIED_ITEMS_NOT_IMPLEMENTED: '統合アイテム機能は実装されていません。',
  
  // Rollover errors
  ROLLOVER_DETECTION_ERROR: '繰り越し検出でエラーが発生しました。',
  ROLLOVER_AUTO_ERROR: '自動繰り越しでエラーが発生しました。',
  ROLLOVER_FAILED: '繰り越し処理に失敗しました。',
} as const

export const SUCCESS_MESSAGES = {
  // Task operations
  TASK_CREATED: 'タスクを作成しました。',
  TASK_UPDATED: 'タスクを更新しました。',
  TASK_DELETED: 'タスクを削除しました。',
  TASK_COMPLETED: 'タスクを完了しました。',
  
  // Recurring task operations
  RECURRING_TASK_CREATED: '繰り返しタスクを作成しました。',
  RECURRING_TASK_UPDATED: '繰り返しタスクを更新しました。',
  RECURRING_TASK_DELETED: '繰り返しタスクを削除しました。',
  RECURRING_TASK_COMPLETED: '繰り返しタスクを完了しました。',
  
  // Authentication
  LOGIN_SUCCESS: 'ログインしました。',
  LOGOUT_SUCCESS: 'ログアウトしました。',
  
  // Admin operations
  ADMIN_APPROVAL_SUCCESS: '承認処理が完了しました。',
  
  // General
  OPERATION_COMPLETED: '処理が完了しました。',
  DATA_SAVED: 'データを保存しました。',
  DATA_LOADED: 'データを読み込みました。',
} as const

export const UI_MESSAGES = {
  // Loading states
  LOADING: '読み込み中...',
  SAVING: '保存中...',
  PROCESSING: '処理中...',
  
  // Empty states
  NO_TASKS: 'タスクがありません。',
  NO_COMPLETED_TASKS: '完了したタスクがありません。',
  NO_RECURRING_TASKS: '繰り返しタスクがありません。',
  NO_RESULTS: '結果がありません。',
  
  // Confirmation messages
  CONFIRM_DELETE: '本当に削除しますか？',
  CONFIRM_COMPLETE: '本当に完了しますか？',
  CONFIRM_LOGOUT: 'ログアウトしますか？',
  
  // Action buttons
  CREATE: '作成',
  EDIT: '編集',
  DELETE: '削除',
  COMPLETE: '完了',
  CANCEL: 'キャンセル',
  SAVE: '保存',
  CLOSE: '閉じる',
  RETRY: '再試行',
  
  // Navigation
  TODAY: '今日',
  SEARCH: '検索',
  STATS: '統計',
  DONE: '完了済み',
  MANAGE: '管理',
} as const

// Helper function to get error message safely
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return ERROR_MESSAGES.UNKNOWN_ERROR
}