# パフォーマンスチェックガイド

## データベースパフォーマンス結果

✅ **良好** - DB処理は問題なし
- 平均クエリ時間: 57.30ms
- 今日のタスク: 83.18ms (2件)
- やることリスト: 39.81ms (1件)
- 完了タスク: 48.90ms (26件)
- サブタスク: 41.43ms/タスク

**結論: DBは遅くない。フロントエンドの問題の可能性が高い**

---

## ブラウザで確認すべき項目

### 1. Chrome DevTools - Performance タブ

1. **ページ移動の記録**
   - DevTools → Performance タブ
   - 記録開始 → ページ移動 → 記録停止
   - 確認ポイント：
     - Scripting (JavaScript実行時間)
     - Rendering (レンダリング時間)
     - Painting (描画時間)

2. **React DevTools - Profiler**
   - React DevTools → Profiler タブ
   - 記録開始 → ページ移動 → 記録停止
   - 確認ポイント：
     - どのコンポーネントが再レンダリングされているか
     - 不要な再レンダリングがないか

### 2. Network タブ

1. **リソース読み込み時間**
   - DevTools → Network タブ
   - ページ移動時のリクエストを確認
   - 確認ポイント：
     - JavaScript bundleのサイズ
     - 画像の最適化
     - 不要なリクエストがないか

### 3. 疑わしい箇所

#### A. ページフォーカス時の自動リロード
`src/hooks/useUnifiedTasks.ts:429-442`
```typescript
// ページフォーカス時の自動リロード
useEffect(() => {
  if (!autoLoad) return

  const handleFocus = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Page focused, invalidating cache and reloading tasks...')
    }
    // キャッシュを無効化してリロード
    queryClient.invalidateQueries({ queryKey: ['unifiedTasks'] })
    loadTasks()
  }
```
→ **タブ切り替えのたびに全データ再取得している可能性**

#### B. useEffectの依存配列
- `loadTasks` が useCallback で定義されているか
- 不要な再実行が発生していないか

#### C. コンポーネントのメモ化不足
- 大きなリストコンポーネントが memo() されているか
- useMemo / useCallback が適切に使われているか

---

## 確認手順

### ステップ1: Console でログ確認
ブラウザのコンソールを開いて、以下のメッセージが過剰に出ていないか確認：
```
Page focused, invalidating cache and reloading tasks...
```

### ステップ2: React DevTools で再レンダリング確認
1. React DevTools → Profiler
2. 「Highlight updates when components render」をON
3. ページ移動やタブ切り替えを行う
4. 画面全体が光る = 全体が再レンダリング（問題あり）
5. 一部のみ光る = 部分的な再レンダリング（正常）

### ステップ3: Performance タブで詳細分析
1. Chrome DevTools → Performance
2. 記録開始
3. 以下の操作を実行：
   - 「今日」→「完了」ページ移動
   - 「完了」→「検索」ページ移動
   - タブ切り替え（別タブ → tasukuタブ）
4. 記録停止
5. 以下を確認：
   - FCP (First Contentful Paint): 画面に何か表示されるまでの時間
   - LCP (Largest Contentful Paint): メインコンテンツ表示完了時間
   - TBT (Total Blocking Time): JavaScript実行でブロックされた時間

---

## 推奨される対応

### すぐにできる改善（影響大）

1. **ページフォーカス時の自動リロードを無効化**
   - タブ切り替えのたびにデータ再取得は不要
   - 手動リロードボタンで対応

2. **useCallback の適切な使用**
   - loadTasks などの関数を useCallback でメモ化
   - useEffect の不要な再実行を防止

3. **コンポーネントのメモ化**
   - TaskTable などの大きなコンポーネントを memo() でラップ
   - props が変わらない限り再レンダリングしない

### 長期的な改善

1. **ページネーション導入**
   - 完了タスクが増えると重くなる可能性

2. **仮想スクロール**
   - 大量のタスクを効率的に表示

3. **Suspense と React.lazy**
   - コード分割で初期読み込みを高速化

---

## チェックリスト

- [ ] Console でログの過剰出力を確認
- [ ] React DevTools で再レンダリングパターンを確認
- [ ] Performance タブで FCP/LCP/TBT を計測
- [ ] Network タブで不要なリクエストを確認
- [ ] useEffect の依存配列を確認
- [ ] コンポーネントのメモ化状況を確認
