# TASUKU Inbox - Chrome拡張機能

思いついたこと、見つけた記事、動画などを瞬時にTASUKUのInboxに保存できるChrome拡張機能です。

## 機能

- **ワンクリック保存**: 現在のページをタイトル+URLで保存
- **カスタム入力**: メモやURLを手動で入力して保存
- **右クリックメニュー**: ページ、リンク、選択テキストから保存
- **キーボードショートカット**: `Ctrl+Shift+I` (Mac: `Cmd+Shift+I`)で起動

## インストール方法

1. Chromeで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」をONにする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `chrome-extension` フォルダを選択

## 使い方

### 方法1: ポップアップから保存
1. 拡張機能アイコンをクリック（または `Ctrl+Shift+I`）
2. 「このページを保存」をクリック

### 方法2: カスタム入力
1. 拡張機能アイコンをクリック
2. テキストエリアにメモやURLを入力
3. 「カスタム保存」をクリック（または `Ctrl+Enter`）

### 方法3: 右クリックメニュー
1. ページ、リンク、テキストを右クリック
2. 「📥 TASUKUのInboxに保存」を選択

## 初回セットアップ

1. TASUKUにログイン（https://tasuku.apaf.me/login）
2. Chrome拡張機能を使用
3. 自動的にセッション情報が保存されます

## アイコンについて

現在、アイコンファイル（icon16.png, icon48.png, icon128.png）が必要です。
以下のサイズで作成してください：
- icon16.png: 16x16px
- icon48.png: 48x48px
- icon128.png: 128x128px

簡易的には、TASUKUのロゴまたは📥の絵文字を使用できます。

## 開発メモ

- Supabase APIを直接使用
- セッション情報は `chrome.storage.local` に保存
- 本番URL: https://tasuku.apaf.me
- ローカル開発: `popup.js` の `INBOX_URL` を `http://localhost:3000/inbox` に変更
