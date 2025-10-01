# データベース直接修正履歴

## 2025-10-01: 繰り返しタスクの復旧とURL修正

### 問題1: 100回朝ジャンプが生成されない

**原因**: テンプレート（ID: `42c8f9c9-5ae7-4b46-ad26-ed7c8a767dfc`）が削除されていた

**対処**:
```sql
-- テンプレートを再作成
INSERT INTO unified_tasks (
  id, user_id, display_number, task_type, title,
  completed, memo, due_date, category, importance,
  active, recurring_pattern, recurring_weekdays, urls
) VALUES (
  '42c8f9c9-5ae7-4b46-ad26-ed7c8a767dfc',
  '93d599a3-ebec-4eb7-995c-b9a36e8eda19',
  'TEMPLATE', 'RECURRING', '100回朝ジャンプ',
  false, '', '2999-12-31', '健康', 3,
  true, 'WEEKLY', ARRAY[1, 3, 4, 5, 7], ARRAY[]::text[]
);

-- 今日のタスクを作成
INSERT INTO unified_tasks (
  user_id, display_number, task_type, title,
  completed, memo, due_date, category, importance,
  active, recurring_template_id, recurring_pattern, recurring_weekdays, urls
) VALUES (
  '93d599a3-ebec-4eb7-995c-b9a36e8eda19',
  'T032', 'RECURRING', '100回朝ジャンプ',
  false, '', '2025-10-01', '健康', 3,
  true, '42c8f9c9-5ae7-4b46-ad26-ed7c8a767dfc', 'WEEKLY', ARRAY[1, 3, 4, 5, 7], ARRAY[]::text[]
);
```

### 問題2: 𝕏ポストのURLがクリック不可

**原因**: URL形式が `list:数字` でクリック不可能

**対処**:
```sql
-- テンプレート更新
UPDATE unified_tasks
SET urls = ARRAY[
  'https://twitter.com/i/lists/1769487534948794610',
  'https://twitter.com/i/lists/1778669827957358973'
]
WHERE id = '0dbaca9e-5240-4e00-8729-16e883e65da7';

-- 今日のタスク更新
UPDATE unified_tasks
SET urls = ARRAY[
  'https://twitter.com/i/lists/1769487534948794610',
  'https://twitter.com/i/lists/1778669827957358973'
]
WHERE id = '72a845ff-e975-46df-a836-5933a213c61c';
```

**修正前**: `list:1769487534948794610 -filter:...`
**修正後**: `https://twitter.com/i/lists/1769487534948794610`