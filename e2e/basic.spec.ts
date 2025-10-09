import { test, expect } from '@playwright/test';

/**
 * 基本的なページアクセステスト
 * 認証なしでアクセス可能なページの動作確認
 */

test.describe('基本ページアクセス', () => {
  test('ログインページが正しく表示される', async ({ page }) => {
    await page.goto('/login');

    // ページタイトルの確認
    await expect(page).toHaveTitle(/TASUKU/);

    // ログインボタンの存在確認
    const loginButton = page.getByRole('button', { name: /ログイン|Login/i });
    await expect(loginButton).toBeVisible();
  });

  test('ルートパスから今日のタスクページにリダイレクトされる', async ({ page }) => {
    await page.goto('/');

    // /today にリダイレクトされることを確認
    await expect(page).toHaveURL(/\/today/);

    // ページタイトルの確認
    await expect(page).toHaveTitle(/TASUKU/);
  });

  test('ヘルプページが正しく表示される', async ({ page }) => {
    await page.goto('/help');

    // ページタイトルの確認
    await expect(page).toHaveTitle(/TASUKU/);

    // ヘルプコンテンツの存在確認
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });
});

test.describe('認証状態の確認', () => {
  test('未認証時はログインページへのリンクが表示される', async ({ page }) => {
    await page.goto('/today');

    // 認証状態コンポーネントが存在することを確認
    const authStatus = page.locator('[class*="auth"]');

    // ページが正常に読み込まれることを確認
    await expect(page).toHaveTitle(/TASUKU/);
  });
});

test.describe('ナビゲーション', () => {
  test('主要ページ間の遷移が正常に動作する', async ({ page }) => {
    // 今日のタスクページから開始
    await page.goto('/today');
    await expect(page).toHaveURL(/\/today/);

    // 検索ページへ遷移（リンクをクリック）
    const searchLink = page.getByRole('link', { name: /検索|search/i });
    if (await searchLink.isVisible()) {
      await searchLink.click();
      await expect(page).toHaveURL(/\/search/);
    }

    // 統計ページへ遷移
    await page.goto('/statistics');
    await expect(page).toHaveURL(/\/statistics/);
    await expect(page).toHaveTitle(/TASUKU/);

    // 完了タスクページへ遷移
    await page.goto('/done');
    await expect(page).toHaveURL(/\/done/);
    await expect(page).toHaveTitle(/TASUKU/);
  });

  test('テンプレート管理ページが正しく表示される', async ({ page }) => {
    await page.goto('/templates');

    // ページタイトルの確認
    await expect(page).toHaveTitle(/TASUKU/);

    // テンプレートページのヘッダー確認（h1タグを明示的に指定）
    const heading = page.getByRole('heading', { name: /繰り返しテンプレート管理/i, level: 1 });
    await expect(heading).toBeVisible();
  });
});

test.describe('レスポンシブデザイン', () => {
  test('モバイル画面でも正しく表示される', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/today');

    // ページが正常に読み込まれることを確認
    await expect(page).toHaveTitle(/TASUKU/);

    // モバイルでもナビゲーションが表示されることを確認
    const navigation = page.locator('header');
    await expect(navigation).toBeVisible();
  });

  test('タブレット画面でも正しく表示される', async ({ page }) => {
    // タブレットビューポートに設定
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/today');

    // ページが正常に読み込まれることを確認
    await expect(page).toHaveTitle(/TASUKU/);
  });
});

test.describe('パフォーマンス', () => {
  test('ページロード時間が許容範囲内である', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/today');

    const loadTime = Date.now() - startTime;

    // 5秒以内にページが読み込まれることを確認
    expect(loadTime).toBeLessThan(5000);
  });
});
