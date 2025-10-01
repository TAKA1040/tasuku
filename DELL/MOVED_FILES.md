# 移動ファイル管理台帳

**作成日**: 2025-10-01
**目的**: DELLフォルダへ移動したファイルの追跡

---

## 📋 移動履歴

### [2025-10-01] Phase 1: 未使用コンポーネント + 古いドキュメント

#### 移動ファイル（未使用コンポーネント）:
1. **TaskCreateForm.tsx**
   - 元: `src/components/TaskCreateForm.tsx`
   - 先: `DELL/components/TaskCreateForm.tsx`
   - サイズ: 15KB
   - 理由: TaskCreateForm2.tsxに置き換え済み、使用されていない
   - 削除リスク: 低

2. **RecurringTaskForm.tsx**
   - 元: `src/components/RecurringTaskForm.tsx`
   - 先: `DELL/components/RecurringTaskForm.tsx`
   - サイズ: 21KB
   - 理由: パラメータ不整合、使用されていない
   - 削除リスク: 低

3. **UnifiedTaskForm.tsx**
   - 元: `src/components/UnifiedTaskForm.tsx`
   - 先: `DELL/components/UnifiedTaskForm.tsx`
   - サイズ: 14KB
   - 理由: パラメータ不整合、使用されていない
   - 削除リスク: 低

#### 移動ファイル（古いドキュメント）:
4-15. **古いドキュメント12ファイル** (67KB)
   - AFTER_RESET_TODO.md - リセット後作業記録
   - CRITICAL_ISSUES.md - 修正済み課題リスト
   - DATABASE_FIXES.md - DB修正記録
   - DEPLOYMENT_STATUS.md - 古いデプロイ情報
   - GOOGLE_LOGIN_MANUAL.md - 設定完了済み
   - MIGRATION_TO_UNIFIED_SYSTEM.md - 移行完了済み
   - MANUAL_MIGRATION_GUIDE.md - 移行ガイド
   - NEXT_SESSION_INSTRUCTIONS.md - WORK_HISTORYに統合済み
   - RECURRING_REDESIGN_LOG.md - 再設計ログ
   - SEARCH_ENHANCEMENT_LOG.md - 実装完了済み
   - REMAINING_TASKS.md - PROJECT_STATUSと重複
   - TASUKU_CODE_AUDIT_REPORT.md - 監査完了済み
   - 移動先: `DELL/docs/`
   - 削除リスク: 低

#### 実施結果:
- **ビルド**: ✅ 成功
- **テスト**: ✅ 警告のみ（既存の警告と同じ）
- **削減サイズ**: 117KB（15ファイル）
- **備考**: 削除による影響なし、プロジェクトは正常に動作

---

## 📝 記録フォーマット

各移動時に以下の形式で記録してください:

```markdown
### [日付] Phase X: [カテゴリ名]

#### 移動ファイル:
- 元: `<元のパス>`
- 先: `DELL/<移動先パス>`
- サイズ: XXkB
- 理由: <削除理由>
- 削除リスク: [低/中/高]

#### 実施結果:
- ビルド: [成功/失敗]
- テスト: [成功/失敗]
- 備考: <問題点や注意事項>
```

---

## 🔄 復元方法

必要に応じてファイルを復元する場合:

```bash
# 特定ファイルの復元
move DELL\<移動先パス>\<ファイル名> <元のパス>

# Gitから復元（commitしている場合）
git checkout HEAD -- <元のパス>
```

---

## ⚠️ 注意事項

1. **移動前に必ずGitでcommit**: 問題発生時のロールバック用
2. **段階的に実施**: Phase単位で移動し、都度ビルド確認
3. **記録を残す**: このファイルに必ず移動履歴を記録
4. **削除は最終手段**: まずはDELLフォルダへ移動、問題なければ後日削除

---

## 📊 削除済みファイル統計

**移動済み**: 0ファイル
**削減サイズ**: 0KB
**実施Phase**: なし

---

_このファイルは移動作業の進捗に応じて随時更新してください。_
