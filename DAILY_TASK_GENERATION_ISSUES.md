# 日次処理テスト失敗事例集

このファイルは日次タスク生成処理（自動繰り返しタスク生成）のテスト中に発生した問題を記録し、再発防止のための知見を蓄積します。

## 📋 目的
- 日次処理の問題パターンを記録
- 根本原因と修正内容を文書化
- 次回の問題発生時に迅速に対処できるよう知見を蓄積
- テスト時の確認項目チェックリストを更新

## ⚠️ テスト期間
- **開始**: 2025-10-02頃
- **継続中**: 毎日の日次処理で動作確認

---

## 🐛 事例1: テンプレートURLs空配列上書き問題 (2025-10-09)

### 症状
- **日次処理で生成される繰り返しタスクのURLsが空になる**
- 「タスク更新」ボタンを押すと一時的に修正されるが、翌日また空になる
- 特定のテンプレート（𝕏ポスト）で繰り返し発生

### 発生日時
- **初回発見**: 2025-10-03頃（推定）
- **継続期間**: 約1週間
- **修正完了**: 2025-10-09

### 根本原因
```
1. タスク編集時にsyncTemplateFromTask()が実行される
2. タスクのURLsが空（編集時にURLsフィールドを触っていない）
3. 保護ロジックがないため、テンプレートのURLsが空配列で上書きされる
4. 次回の日次処理でテンプレートから生成されるタスクも空URLsになる

⚠️ 問題の核心:
- テンプレート自体のデータが破壊されているため、何度タスク生成しても空のまま
- 「タスク更新」ボタンは既存タスクの同期処理なので、テンプレートは修復されない
```

### 修正内容
**Commit**: 9522ccd

**ファイル**: `src/lib/db/unified-tasks.ts`

```typescript
// syncTemplateFromTask関数にURLs保護ロジック追加
const taskUrls = task.urls || []
const templateUrls = existingTemplate.urls || []
const finalUrls = (taskUrls.length === 0 && templateUrls.length > 0) ? templateUrls : taskUrls

// タスクのURLsが空でもテンプレートのURLsを保持
if (taskUrls.length === 0 && templateUrls.length > 0) {
  console.log('🛡️ URLs保護: タスクのURLsが空ですが、テンプレートのURLsを保持します')
}
```

### 学んだこと
1. **データ保護の重要性**: テンプレートの重要データ（URLs, weekdays, 時刻など）は簡単に上書きされないよう保護が必要
2. **同期方向の明確化**: タスク→テンプレートの同期は慎重に。空データで上書きしないこと
3. **テスト項目**: 日次処理後は必ずURLsの存在を確認すること

### 再発防止策
- ✅ コード修正完了（syncTemplateFromTaskに保護ロジック追加）
- ⚠️ テンプレートデータ整合性チェックスクリプト作成（TODO）
- ⚠️ 日次処理後の自動検証スクリプト作成（TODO）

### 関連ファイル
- `WORK_HISTORY.md` - 詳細な修正履歴
- `fix_xpost_template_urls.sql` - テンプレート修復用SQL
- `check_and_fix_template.ts` - テンプレート確認・修復ツール

---

## 🐛 事例2: （今後追加予定）

---

## 📋 日次処理テスト時の確認チェックリスト

### テスト前の準備
- [ ] 前回の日次処理結果を確認（WORK_HISTORY.md）
- [ ] テンプレートデータが正しいか確認（URLs, weekdays, 時刻）
- [ ] 前日のタスクが正しく生成されているか確認

### テスト実行
- [ ] 本番環境でログイン
- [ ] https://tasuku.apaf.me/today にアクセス
- [ ] ブラウザコンソールで日次処理のログを確認
- [ ] タスク生成のログを確認（`🚀 タスク生成開始`）

### テスト後の確認
- [ ] 今日のタスクが正しく生成されているか
- [ ] **URLsが空でないか**（特に𝕏ポストタスク）
- [ ] 開始時刻・終了時刻が設定されているか
- [ ] 曜日指定が正しく動作しているか（週次タスク）
- [ ] 買い物タスクの繰り越し処理が動作しているか

### 問題発生時
- [ ] ブラウザコンソールのエラーログをコピー
- [ ] 問題のスクリーンショットを保存
- [ ] このファイル（DAILY_TASK_GENERATION_ISSUES.md）に事例を追加
- [ ] WORK_HISTORY.mdに修正内容を記録
- [ ] prompt.txtに修正指示を記載（必要に応じて）

---

## 🔍 デバッグ用ツール

### テンプレート確認
```bash
npx tsx check_and_fix_template.ts
```

### タスク生成状況確認
```bash
# ブラウザコンソールで以下を確認
🔄 タスク生成を開始...
🚀 タスク生成開始: 今日=YYYY-MM-DD, 前回=YYYY-MM-DD
📝 テンプレートからタスク生成: {...}
✅ タスク作成成功: ...
```

### SQL直接確認
```sql
-- テンプレートのURLs確認
SELECT id, title, urls, pattern, active
FROM recurring_templates
WHERE title LIKE '%ポスト%'
ORDER BY created_at DESC;

-- 今日のタスクのURLs確認
SELECT id, title, urls, due_date, recurring_template_id
FROM unified_tasks
WHERE due_date = CURRENT_DATE
  AND recurring_template_id IS NOT NULL
ORDER BY created_at DESC;
```

---

## 📊 統計・メトリクス（今後追加予定）

- テスト日数: 8日間（2025-10-02 〜 2025-10-09）
- 発見した問題数: 1件
- 修正完了: 1件
- 未解決: 0件

---

**最終更新**: 2025-10-09
**管理者**: Claude Code（作業記録は必ずこのファイルに追記すること）
