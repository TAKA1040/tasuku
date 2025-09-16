// ID Generator Utility
// 統一されたID生成機能

/**
 * ユニークIDを生成
 */
export function generateId(): string {
  return crypto.randomUUID()
}