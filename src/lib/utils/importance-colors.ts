/**
 * 重要度の色分けユーティリティ
 * 1: 青 → 5: 赤 のグラデーション
 */

import React from 'react'

export function getImportanceColor(importance?: number): string {
  if (!importance) return '#9ca3af' // グレー（重要度なし）

  switch (importance) {
    case 1:
      return '#3b82f6' // 青
    case 2:
      return '#06b6d4' // シアン
    case 3:
      return '#eab308' // 黄
    case 4:
      return '#f97316' // オレンジ
    case 5:
      return '#ef4444' // 赤
    default:
      return '#9ca3af' // グレー
  }
}

export function getImportanceLabel(importance?: number): string {
  if (!importance) return '未設定'

  switch (importance) {
    case 1:
      return '低'
    case 2:
      return '低中'
    case 3:
      return '中'
    case 4:
      return '中高'
    case 5:
      return '高'
    default:
      return '未設定'
  }
}

/**
 * 重要度の丸を表示するコンポーネント用のprops
 */
export interface ImportanceDotProps {
  importance?: number
  size?: number
  showTooltip?: boolean
}

/**
 * インライン重要度ドットのスタイル
 */
export function getImportanceDotStyle(importance?: number, size: number = 12): React.CSSProperties {
  return {
    display: 'inline-block',
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    backgroundColor: getImportanceColor(importance),
    marginRight: '6px',
    flexShrink: 0,
    border: '1px solid rgba(0, 0, 0, 0.1)'
  }
}