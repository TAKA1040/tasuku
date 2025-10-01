# 🚨 CRITICAL ISSUES - プロダクション販売前必須修正事項

## 販売用ツールとしての致命的不整合

### ❌ ISSUE #1: TaskCreateForm.tsx の durationMin 完全欠落

**場所**: `src/components/TaskCreateForm.tsx:8`
```typescript
// 現在の不正なシグネチャ
onSubmit: (title: string, memo: string, dueDate: string, category?: string, importance?: number, urls?: string[])

// 正しいシグネチャ（hooks/useTasks.ts:190に合わせる）
onSubmit: (title: string, memo?: string, dueDate?: string, category?: string, importance?: number, durationMin?: number, urls?: string[])
```

**影響**: ユーザーが所要時間を入力できない → データ不整合 → 統計機能破綻

### ❌ ISSUE #2: RecurringTaskForm.tsx の大量パラメータ欠落

**場所**: `src/components/RecurringTaskForm.tsx:6`
```typescript
// 現在の不正なシグネチャ
onSubmit: (title: string, memo: string, pattern: string, dayOfWeek?: number, dayOfMonth?: number)

// 正しいシグネチャ（useRecurringTasks.ts:131に合わせる）
onSubmit: (title: string, memo?: string, frequency: string, intervalN?: number, weekdays?: number[], monthDay?: number, startDate?: string, endDate?: string, importance?: number, durationMin?: number, urls?: string[])
```

**欠落項目**: importance, durationMin, urls, startDate, endDate
**影響**: 繰り返しタスクで高度な機能が利用不可 → 機能半分無効

### ❌ ISSUE #3: UnifiedTaskForm.tsx の durationMin 完全欠落

**場所**: `src/components/UnifiedTaskForm.tsx`
**影響**: 統一フォームで所要時間設定不可

### ❌ ISSUE #4: データベーススキーマとフォームの不整合

**現在のDB設計**: 過剰設計（未実装機能まで含む）
**実際の必要項目**: フォーム分析による厳選項目

## 🛠️ 必須修正項目

### 1. TaskCreateForm.tsx の修正
```typescript
// 修正必要箇所
interface TaskCreateFormProps {
  onSubmit: (title: string, memo?: string, dueDate?: string, category?: string, importance?: number, durationMin?: number, urls?: string[]) => Promise<void>
  // ↑ durationMin パラメータ追加必須
}

// フォームに durationMin 入力フィールド追加必須
```

### 2. RecurringTaskForm.tsx の完全リファクタ
```typescript
// 完全にパラメータ構造変更が必要
// 現在: 5パラメータ → 正しく: 11パラメータ
// importance, durationMin, urls フィールド追加必須
```

### 3. UnifiedTaskForm.tsx の修正
```typescript
// durationMin フィールド追加必須
```

### 4. データベーススキーマ最適化
```sql
-- 現在: supabase-schema.sql (6テーブル、多数未使用項目)
-- 正しく: supabase-schema-corrected.sql (3テーブル、実使用項目のみ)
```

## ✅ 正しく動作しているコンポーネント

- TaskCreateForm2.tsx ✅ 完璧
- TaskEditForm.tsx ✅ 完璧  
- useTasks.ts ✅ 完璧
- useRecurringTasks.ts ✅ 完璧

## 🎯 今日のページ実装との整合性

`src/app/today/page.tsx` では：
- handleCreateRegular: ✅ durationMin 正しく処理
- handleCreateRecurring: ✅ 全パラメータ正しく処理
- handleUpdateTask: ✅ 全パラメータ正しく処理

**結論**: フォーム→ページハンドラー→hooksの流れで、フォーム層だけが不完全

## 📊 データフロー整合性評価

| コンポーネント | 整合性 | 修正必要度 |
|-------------|--------|-----------|
| TaskCreateForm | ❌ 不整合 | 🔴 HIGH |
| TaskCreateForm2 | ✅ 完璧 | ✅ なし |
| RecurringTaskForm | ❌ 重大不整合 | 🔴 CRITICAL |
| TaskEditForm | ✅ 完璧 | ✅ なし |
| UnifiedTaskForm | ❌ 不整合 | 🔴 HIGH |
| useTasks hook | ✅ 完璧 | ✅ なし |
| useRecurringTasks hook | ✅ 完璧 | ✅ なし |
| DB Schema | ❌ 過剰設計 | 🟡 MEDIUM |

## 🚨 販売への影響

### プロダクションバグ
1. **データ損失**: durationMin が保存されない
2. **機能不完全**: 繰り返しタスクで高度機能使用不可
3. **ユーザー体験不良**: フォーム間で機能差が存在
4. **統計機能破綻**: 所要時間データ不足で分析不可

### 修正優先度
1. 🔴 CRITICAL: RecurringTaskForm.tsx 完全リファクタ
2. 🔴 HIGH: TaskCreateForm.tsx durationMin 追加
3. 🔴 HIGH: UnifiedTaskForm.tsx durationMin 追加
4. 🟡 MEDIUM: DB最適化スキーマ適用

これらの修正なしに販売は不可能です。