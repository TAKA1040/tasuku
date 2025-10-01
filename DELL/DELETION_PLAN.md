# 不要ファイル削除計画

**作成日**: 2025-10-01
**分析対象**: C:\Windsurf\tasuku プロジェクト
**分析結果**: 44ファイル（約200KB）を削除推奨

---

## 📊 削除カテゴリ別サマリー

### 🔴 即削除可能（低リスク・高効果）: 117KB

#### 1. 未使用コンポーネント（50KB）
- `src/components/TaskCreateForm.tsx` - TaskCreateForm2.tsxに置き換え済み
- `src/components/RecurringTaskForm.tsx` - パラメータ不整合、未使用
- `src/components/UnifiedTaskForm.tsx` - パラメータ不整合、未使用

#### 2. 古いドキュメント（67KB）
- `AFTER_RESET_TODO.md` - リセット後作業（2025-09-22完了済み）
- `CRITICAL_ISSUES.md` - 販売前修正事項（修正済み）
- `DATABASE_FIXES.md` - DB修正記録（完了済み）
- `DEPLOYMENT_STATUS.md` - 古いデプロイ情報
- `GOOGLE_LOGIN_MANUAL.md` - 設定完了済み
- `MIGRATION_TO_UNIFIED_SYSTEM.md` - 移行完了済み
- `MANUAL_MIGRATION_GUIDE.md` - 移行完了済み
- `NEXT_SESSION_INSTRUCTIONS.md` - WORK_HISTORYに統合済み
- `RECURRING_REDESIGN_LOG.md` - 再設計完了済み
- `SEARCH_ENHANCEMENT_LOG.md` - 実装完了済み
- `REMAINING_TASKS.md` - PROJECT_STATUSと重複
- `TASUKU_CODE_AUDIT_REPORT.md` - 監査・修正完了済み

---

### 🟡 要検討（中リスク）: 54KB

#### 3. 開発スクリプト（26KB）
- `.dev-tools/debug-detailed.js`
- `.dev-tools/debug-weekly.js`
- `.dev-tools/test-detailed.js`
- `.dev-tools/test-fix.js`
- `.dev-tools/test-specific.js`
- `check-current-user.js`
- `check-recurring-tasks.js`
- `check-tasks.js`
- `check-template-schema.js`
- `compare-schemas.js`
- `test-url-insert.js`

**削除リスク**: 開発時に再度必要になる可能性あり

#### 4. 移行・修復SQL（6.6KB）
- `check_and_fix.sql`
- `check_template_sync.sql`
- `cleanup-shopping-memo.sql`
- `debug_templates.sql`
- `fix-urls-data.sql`
- `force_fix_templates.sql`
- `manual_migration.sql`
- `supabase-setup.sql`

**削除リスク**: すでに実行済み、履歴価値のみ

#### 5. テストページ（13KB）
- `src/app/shopping-test/page.tsx` - 買い物機能テスト
- `src/app/migrate-unified/page.tsx` - 移行完了済み

**削除リスク**: debugとtestページは開発環境限定で残す価値あり

#### 6. 未使用ライブラリ（8KB）
- `src/lib/utils/recurring-test.ts` - テスト関数
- `src/lib/db/migrate-to-unified.ts` - 移行処理

**削除リスク**: 移行済みなので不要

#### 7. 参考ドキュメント（29KB）
- `SECURITY_ROADMAP.md` - セキュリティ計画
- `FEATURE_SUMMARY.md` - 機能まとめ
- `supabase-schema-corrected.sql` - バックアップスキーマ
- `local-dev-fixed.ps1` - 重複スクリプト

**削除リスク**: 将来参照する可能性低い

---

## 🚫 削除不可ファイル

### 現在進行形の管理ファイル
- `WORK_HISTORY.md` - 作業履歴（継続使用中）
- `PROJECT_STATUS.md` - プロジェクト進捗
- `SECURITY_AND_CI_DECLARATION.md` - セキュリティポリシー
- `prompt.txt` - 指示ファイル

### 開発補助スクリプト（便利）
- `dev.bat` - ローカル開発起動バッチ
- `local-dev.ps1` - PowerShell起動スクリプト

### Supabase Migrations（削除厳禁）
- `supabase/migrations/*.sql` - 全37ファイル
- **理由**: データベース履歴、削除するとDB再構築時に問題発生

---

## 🎯 段階的削除プラン

### Phase 1: 即座削除（低リスク）✅ 推奨

```bash
# 未使用コンポーネント削除
move src\components\TaskCreateForm.tsx DELL\components\
move src\components\RecurringTaskForm.tsx DELL\components\
move src\components\UnifiedTaskForm.tsx DELL\components\

# 古いドキュメント削除
move AFTER_RESET_TODO.md DELL\docs\
move CRITICAL_ISSUES.md DELL\docs\
move DATABASE_FIXES.md DELL\docs\
move DEPLOYMENT_STATUS.md DELL\docs\
move GOOGLE_LOGIN_MANUAL.md DELL\docs\
move MIGRATION_TO_UNIFIED_SYSTEM.md DELL\docs\
move MANUAL_MIGRATION_GUIDE.md DELL\docs\
move NEXT_SESSION_INSTRUCTIONS.md DELL\docs\
move RECURRING_REDESIGN_LOG.md DELL\docs\
move SEARCH_ENHANCEMENT_LOG.md DELL\docs\
move REMAINING_TASKS.md DELL\docs\
move TASUKU_CODE_AUDIT_REPORT.md DELL\docs\

# 確認
npm run build
```

**削減**: 117KB
**リスク**: 低
**実施後**: ビルド確認必須

---

### Phase 2: テストページ削除（要慎重）⚠️

```bash
# 移行完了済みページ
move src\app\migrate-unified DELL\pages\
move src\app\shopping-test DELL\pages\

# debug/testページは残す（開発環境限定で動作）
# 理由: 本番ビルドに影響なし、デバッグ用に有用

# 確認
npm run build
```

**削減**: 13KB
**リスク**: 低（移行完了済み）

---

### Phase 3: 開発スクリプト削除（任意）

```bash
# .dev-toolsフォルダごと移動
move .dev-tools DELL\scripts\

# 個別スクリプト移動
move check-current-user.js DELL\scripts\
move check-recurring-tasks.js DELL\scripts\
move check-tasks.js DELL\scripts\
move check-template-schema.js DELL\scripts\
move compare-schemas.js DELL\scripts\
move test-url-insert.js DELL\scripts\
```

**削減**: 26KB
**リスク**: 中（開発時に再度必要な可能性）

---

### Phase 4: SQL修復ファイル削除（任意）

```bash
# 実行済みSQL移動
move check_and_fix.sql DELL\sql\
move check_template_sync.sql DELL\sql\
move cleanup-shopping-memo.sql DELL\sql\
move debug_templates.sql DELL\sql\
move fix-urls-data.sql DELL\sql\
move force_fix_templates.sql DELL\sql\
move manual_migration.sql DELL\sql\
move supabase-setup.sql DELL\sql\
```

**削減**: 6.6KB
**リスク**: 低（履歴価値のみ）

---

### Phase 5: 未使用ライブラリ削除（任意）

```bash
# 移行完了に伴い不要
move src\lib\utils\recurring-test.ts DELL\lib\
move src\lib\db\migrate-to-unified.ts DELL\lib\
```

**削減**: 8KB
**リスク**: 低（移行完了済み）

---

### Phase 6: 重複・不要ドキュメント削除（任意）

```bash
# 参考価値低いドキュメント
move SECURITY_ROADMAP.md DELL\docs\
move FEATURE_SUMMARY.md DELL\docs\
move supabase-schema-corrected.sql DELL\sql\
move local-dev-fixed.ps1 DELL\scripts\
```

**削減**: 29KB
**リスク**: 低

---

## 📋 削除前チェックリスト

### 必須作業
- [ ] 現在の状態をGitでバックアップ
  ```bash
  git add .
  git commit -m "backup: Before file cleanup"
  ```
- [ ] DELLフォルダ構造を作成
  ```bash
  mkdir DELL\components DELL\docs DELL\pages DELL\scripts DELL\sql DELL\lib
  ```
- [ ] DELL/MOVED_FILES.md を作成（移動履歴記録用）

### 段階実行
- [ ] Phase 1実行 → `npm run build` → 動作確認
- [ ] Phase 2実行 → 再ビルド → 動作確認
- [ ] Phase 3-6は任意（必要に応じて実行）

### ロールバック準備
```bash
# 問題発生時
git reset --hard HEAD
# または
git checkout -- <ファイル>
```

---

## 🎯 推奨実施順序

1. **今すぐ実施**: Phase 1（117KB削減、リスク低）
2. **検討後実施**: Phase 2（13KB削減、移行完了確認後）
3. **任意**: Phase 3-6（必要性を判断後）

---

## 📈 期待効果

### 削減効果
- **ファイル数**: 44ファイル削減
- **サイズ**: 約200KB削減
- **クリーンアップ率**: プロジェクト整理度向上

### 実質的メリット
- プロジェクト構造の明確化
- 開発効率の向上（無関係ファイル減少）
- Git履歴の整理
- 保守性の向上

---

**注意**: このプランは慎重に段階的に実施してください。各Phaseごとにビルドとテストを行い、問題がないことを確認してから次のPhaseに進んでください。
