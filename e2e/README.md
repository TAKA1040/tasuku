# E2Eテスト (Playwright)

このディレクトリには、Playwrightを使用したEnd-to-End（E2E）テストが含まれています。

## セットアップ

### 初回のみ（ブラウザインストール）

```bash
npx playwright install chromium
```

## テストの実行

### 通常実行（ヘッドレスモード）

```bash
npm run test:e2e
```

### UIモードで実行（推奨）

テストを対話的に実行・デバッグできます：

```bash
npm run test:e2e:ui
```

### ブラウザを表示して実行

```bash
npm run test:e2e:headed
```

### テストレポート表示

```bash
npm run test:e2e:report
```

## テストファイル構成

```
e2e/
├── README.md           # このファイル
└── basic.spec.ts      # 基本的なページアクセステスト
```

## テストカバレッジ

### basic.spec.ts

- **基本ページアクセス**
  - ログインページ表示確認
  - ルートパスからのリダイレクト確認
  - ヘルプページ表示確認

- **認証状態の確認**
  - 未認証時の動作確認

- **ナビゲーション**
  - 主要ページ間の遷移確認
  - テンプレート管理ページ表示確認

- **レスポンシブデザイン**
  - モバイル画面での表示確認
  - タブレット画面での表示確認

- **パフォーマンス**
  - ページロード時間の測定

## 新しいテストの追加

1. `e2e/` ディレクトリに `*.spec.ts` ファイルを作成
2. Playwrightのテストを記述
3. `npm run test:e2e` で実行

### テストファイル例

```typescript
import { test, expect } from '@playwright/test';

test('新しいテスト', async ({ page }) => {
  await page.goto('/your-page');

  // アサーション
  await expect(page).toHaveTitle(/TASUKU/);
});
```

## 注意事項

### 開発サーバーの自動起動

`playwright.config.ts` で開発サーバーが自動起動するように設定されています：

```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
}
```

### 認証が必要なテスト

認証が必要なページのテストは、Supabaseのテスト用アカウントを使用するか、
モックデータを使用する必要があります（今後実装予定）。

## トラブルシューティング

### テストが失敗する場合

1. **開発サーバーが起動しているか確認**
   ```bash
   npm run dev
   ```

2. **ブラウザが正しくインストールされているか確認**
   ```bash
   npx playwright install chromium
   ```

3. **テスト結果とスクリーンショットを確認**
   ```bash
   npm run test:e2e:report
   ```

### パフォーマンス問題

テストが遅い場合は、`playwright.config.ts` の `timeout` や `workers` 設定を調整してください。

## 参考リンク

- [Playwright公式ドキュメント](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Tests](https://playwright.dev/docs/debug)
