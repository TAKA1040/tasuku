import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright設定ファイル
 * 参照: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  // テストタイムアウト（30秒）
  timeout: 30 * 1000,

  // 並列実行の設定
  fullyParallel: true,

  // CIでは失敗時にリトライしない
  forbidOnly: !!process.env.CI,

  // リトライ回数
  retries: process.env.CI ? 2 : 0,

  // ワーカー数
  workers: process.env.CI ? 1 : undefined,

  // レポート設定
  reporter: 'html',

  // 共通設定
  use: {
    // ベースURL（開発サーバー）
    baseURL: 'http://localhost:3000',

    // トレース設定（失敗時のみ）
    trace: 'on-first-retry',

    // スクリーンショット（失敗時のみ）
    screenshot: 'only-on-failure',
  },

  // プロジェクト設定
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 開発サーバー設定
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
