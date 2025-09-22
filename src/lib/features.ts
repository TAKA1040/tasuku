// フィーチャーフラグ管理
// 段階的機能有効化とデバッグ用

// Supabaseデータベースを使用する場合は supabase-database をimport
// import { supabaseDb as db } from './db/supabase-database'
// import type { Settings } from './db/schema' // 将来使用予定

/**
 * フィーチャーフラグの型定義
 */
export interface FeatureFlags {
  connectors_readonly: boolean    // PHASE 4: Google/Outlook読み取り連携
  plan_suggestion: boolean        // PHASE 4.2: 「今日を計画」提案機能  
  ml_ranking: boolean            // PHASE 5: 機械学習ベース優先度
  geolocation: boolean           // PHASE 6: 位置ベース優先度
}

/**
 * デフォルトのフィーチャーフラグ設定
 */
export const DEFAULT_FEATURES: FeatureFlags = {
  connectors_readonly: false,
  plan_suggestion: false,
  ml_ranking: false,
  geolocation: false
}

/**
 * 現在のフィーチャーフラグを取得
 * TODO: Supabaseデータベース実装を接続
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  try {
    // TODO: Supabaseからsettingsを取得
    // const settings = await db.getSettings()
    // return { ...DEFAULT_FEATURES, ...settings.features }
    return DEFAULT_FEATURES
  } catch (error) {
    console.warn('Failed to load feature flags, using defaults:', error)
    return DEFAULT_FEATURES
  }
}

/**
 * 特定フィーチャーの有効状態を確認
 */
export async function isFeatureEnabled(feature: keyof FeatureFlags): Promise<boolean> {
  const flags = await getFeatureFlags()
  return flags[feature]
}

/**
 * フィーチャーフラグを更新
 * TODO: Supabaseデータベース実装を接続
 */
export async function updateFeatureFlag(
  feature: keyof FeatureFlags,
  enabled: boolean
): Promise<void> {
  const current = await getFeatureFlags()
  const updated = { ...current, [feature]: enabled }

  // TODO: Supabaseでsettingsを更新
  // await db.updateSettings({ features: updated })
  console.log('Feature flag would be updated:', feature, enabled)
}

/**
 * 複数のフィーチャーフラグを一括更新
 * TODO: Supabaseデータベース実装を接続
 */
export async function updateFeatureFlags(updates: Partial<FeatureFlags>): Promise<void> {
  const current = await getFeatureFlags()
  const updated = { ...current, ...updates }

  // TODO: Supabaseでsettingsを更新
  // await db.updateSettings({ features: updated })
  console.log('Feature flags would be updated:', updates)
}

/**
 * フィーチャーフラグの説明情報
 */
export const FEATURE_DESCRIPTIONS: Record<keyof FeatureFlags, {
  name: string
  description: string
  phase: string
  dependencies?: (keyof FeatureFlags)[]
}> = {
  connectors_readonly: {
    name: '外部連携（読み取り）',
    description: 'Google Calendar/Gmail/Outlookからの情報取り込み',
    phase: 'PHASE 4',
  },
  plan_suggestion: {
    name: '今日を計画',
    description: '空き時間に基づく自動スケジュール提案',
    phase: 'PHASE 4.2',
    dependencies: ['connectors_readonly']
  },
  ml_ranking: {
    name: '学習型優先度',
    description: 'ユーザー行動から学習する並び順最適化',
    phase: 'PHASE 5',
  },
  geolocation: {
    name: '位置ベース優先度',
    description: '現在地に近いタスクの優先表示',
    phase: 'PHASE 6',
  }
} as const

/**
 * フィーチャーの依存関係をチェック
 */
export async function validateFeatureDependencies(
  feature: keyof FeatureFlags, 
  enabled: boolean
): Promise<{ valid: boolean; missingDeps?: string[] }> {
  if (!enabled) return { valid: true }
  
  const description = FEATURE_DESCRIPTIONS[feature]
  if (!description.dependencies?.length) return { valid: true }
  
  const currentFlags = await getFeatureFlags()
  const missingDeps = description.dependencies.filter(dep => !currentFlags[dep])
  
  return {
    valid: missingDeps.length === 0,
    missingDeps: missingDeps.length > 0 ? missingDeps : undefined
  }
}

/**
 * フィーチャー別のコンポーネント表示制御用のヘルパー
 * 実際のコンポーネントは別ファイルで実装
 */
export function createFeatureGateConfig<T extends keyof FeatureFlags>(feature: T) {
  return {
    feature,
    description: FEATURE_DESCRIPTIONS[feature]
  }
}

/**
 * 開発環境用のフィーチャーフラグ設定
 */
export const DEV_FEATURES: Partial<FeatureFlags> = {
  // 開発時はすべて有効化する場合
  // connectors_readonly: true,
  // plan_suggestion: true,
  // ml_ranking: true,
  // geolocation: true,
}

/**
 * フィーチャーフラグの初期化（開発環境用）
 */
export async function initializeDevFeatures(): Promise<void> {
  if (process.env.NODE_ENV === 'development' && Object.keys(DEV_FEATURES).length > 0) {
    console.log('Initializing development feature flags:', DEV_FEATURES)
    await updateFeatureFlags(DEV_FEATURES)
  }
}