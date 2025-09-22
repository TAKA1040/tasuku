# Chrome Debug Port - Claude Code連携設定ガイド

## 📖 概要

Chrome Debug Port（CDP）を使用して、Claude CodeがWEBブラウザのコンソールログやエラー情報にリアルタイムでアクセスできるようにする設定方法とルール。

## 🚀 初回設定

### 1. Chromeをデバッグモードで起動

```bash
# 既存のChromeプロセスを終了
taskkill /F /IM chrome.exe

# デバッグポート有効でChrome起動
chrome --remote-debugging-port=9222 --user-data-dir=c:/temp/chrome-debug
```

### 2. 自動起動バッチファイル作成

**ファイル**: `C:\temp\chrome-debug.bat`
```batch
@echo off
REM Kill existing Chrome processes
taskkill /F /IM chrome.exe 2>nul

REM Start Chrome with debug port
start chrome --remote-debugging-port=9222 --user-data-dir=c:/temp/chrome-debug %*

echo Chrome Debug Mode started on port 9222
echo You can now use Claude Code to access browser console
pause
```

### 3. 動作確認

```bash
# デバッグポートの接続確認
curl -s http://localhost:9222/json/list

# 成功例：タブリストが表示される
# [{"id": "...", "title": "...", "url": "...", "webSocketDebuggerUrl": "ws://..."}]
```

## 🔧 Claude Code での使用方法

### 基本コマンド

```bash
# 利用可能なタブの一覧取得
curl -s http://localhost:9222/json/list

# 特定のページ（localhost:3000）を検索
curl -s http://localhost:9222/json/list | grep "localhost:3000"

# 新しいタブを作成
curl -X PUT "http://localhost:9222/json/new?http://localhost:3000/today"

# ページIDを取得
PAGE_ID=$(curl -s http://localhost:9222/json/list | grep "localhost:3000" -A 5 | grep '"id"' | sed 's/.*"id":"\([^"]*\)".*/\1/' | head -1)
```

### WebSocketデバッグ

```bash
# wscatツールのインストール（初回のみ）
npm install -g wscat

# Runtime APIを有効化
echo '{"id":1,"method":"Runtime.enable"}' | wscat -c ws://localhost:9222/devtools/page/[PAGE_ID] --wait 1

# コンソールログの監視
echo '{"id":2,"method":"Log.enable"}' | wscat -c ws://localhost:9222/devtools/page/[PAGE_ID] --wait 1
```

### 🚀 リアルタイムコンソール監視システム

#### 自動コンソールリーダーの作成

**ファイル**: `C:\temp\console-reader.js`
```javascript
const WebSocket = require('ws');

// 動的にページIDを取得
async function getPageId() {
  const response = await fetch('http://localhost:9222/json/list');
  const tabs = await response.json();
  const targetTab = tabs.find(tab => tab.url.includes('localhost:3000'));
  return targetTab ? targetTab.id : null;
}

let pageId;
(async () => {
  pageId = await getPageId();
  if (!pageId) {
    console.error('localhost:3000 タブが見つかりません');
    process.exit(1);
  }

  console.log('Monitoring console for page:', pageId);
  const ws = new WebSocket(`ws://localhost:9222/devtools/page/${pageId}`);

  ws.on('open', function open() {
    console.log('Connected to Chrome DevTools');

    // Enable Runtime domain
    ws.send(JSON.stringify({"id": 1, "method": "Runtime.enable"}));

    // Enable Console domain
    ws.send(JSON.stringify({"id": 2, "method": "Console.enable"}));

    // Enable Log domain
    ws.send(JSON.stringify({"id": 3, "method": "Log.enable"}));
  });

  ws.on('message', function message(data) {
    const msg = JSON.parse(data);

    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('=== CONSOLE LOG ===');
      console.log('Type:', msg.params.type);
      console.log('Text:', msg.params.args.map(arg => arg.value || arg.description).join(' '));
      console.log('==================');
    }

    if (msg.method === 'Runtime.exceptionThrown') {
      console.log('=== ERROR ===');
      console.log('Exception:', msg.params.exceptionDetails.text);
      console.log('Stack:', msg.params.exceptionDetails.stackTrace);
      console.log('=============');
    }

    if (msg.method === 'Log.entryAdded') {
      console.log('=== LOG ENTRY ===');
      console.log('Level:', msg.params.entry.level);
      console.log('Text:', msg.params.entry.text);
      console.log('=================');
    }
  });

  ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
  });

  console.log('Press Ctrl+C to stop');
})();
```

#### 使用方法

```bash
# 1. 依存関係のインストール（初回のみ）
cd C:\temp && npm install ws
# Note: fetch API is built-in since Node.js 18+

# 2. Chrome Debug Portが有効か確認
curl -s http://localhost:9222/json/list | findstr localhost:3000

# 3. コンソール監視開始（フォアグラウンド）
cd C:\temp && node console-reader.js

# 4. バックグラウンド実行（Windowsの場合）
cd C:\temp
start /B node console-reader.js > console-log.txt

# 5. バックグラウンド実行（PowerShellの場合）
cd C:\temp
Start-Process -WindowStyle Hidden node -ArgumentList "console-reader.js"
```

#### 実際の検出例

```
=== CONSOLE LOG ===
Type: info
Text: %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
==================

=== CONSOLE LOG ===
Type: log
Text: Database not yet initialized, skipping unified task loading
==================

=== CONSOLE LOG ===
Type: log
Text: Starting database initialization...
==================

=== CONSOLE LOG ===
Type: log
Text: No authenticated user found, initializing in guest mode
==================

=== CONSOLE LOG ===
Type: log
Text: unified_tasks table is accessible
==================

=== CONSOLE LOG ===
Type: log
Text: Supabase Database initialized in guest mode
==================

=== CONSOLE LOG ===
Type: error
Text: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
==================

=== CONSOLE LOG ===
Type: log
Text: Loaded 48 unified tasks
==================
```

## 📋 運用ルール

### 1. セッション開始時の手順

1. **Chrome Debug Port確認**:
   ```bash
   curl -s http://localhost:9222/json/list >/dev/null 2>&1
   if [ $? -eq 0 ]; then
       echo "Chrome Debug Port: OK"
   else
       echo "Chrome Debug Port: NG - 起動が必要"
       # バッチファイル実行を促す
   fi
   ```

2. **対象ページの確認**:
   ```bash
   curl -s http://localhost:9222/json/list | grep "localhost:3000"
   ```

3. **ページが見つからない場合**:
   ```bash
   curl -X PUT "http://localhost:9222/json/new?http://localhost:3000"
   ```

### 2. デバッグ時の標準的な流れ

1. **エラー発生時**:
   - Chrome Debug Portでコンソールエラーを即座に確認
   - WebSocketを使用してリアルタイム監視
   - エラーログとソースコードを関連付けて分析

2. **機能テスト時**:
   - ユーザー操作前にコンソール監視を開始
   - 操作実行
   - コンソールログの確認とエラーハンドリング

3. **パフォーマンス分析時**:
   - Network APIでリクエスト監視
   - Performance APIで実行時間測定
   - Memory APIでメモリ使用量確認

### 3. 各開発ツールでの統合

#### Claude Code
```bash
# 標準的なデバッグ開始コマンド
curl -s http://localhost:9222/json/list | grep "localhost:3000" -q
if [ $? -eq 0 ]; then
    echo "Debug ready - Chrome Debug Port connected"
else
    echo "Setting up Chrome Debug Port..."
    # 自動セットアップ処理
fi
```

#### Windsurf
- Chrome Debug Portの状態を定期的に確認
- エラー発生時にブラウザコンソールを自動参照
- デバッグ情報をIDE内に表示

#### Gemini CLI
- CDP APIを使用してパフォーマンス分析
- 自動テスト実行時のコンソール監視
- エラーレポートの自動生成

## 🛠️ トラブルシューティング

### よくある問題と解決策

#### 1. ポート9222が使用中
```bash
# ポート使用状況確認
netstat -ano | findstr :9222

# プロセス終了
taskkill /F /PID [PID番号]
```

#### 2. WebSocket接続エラー
```bash
# Chrome プロセス確認
tasklist | findstr chrome

# Chrome 完全再起動
taskkill /F /IM chrome.exe
start chrome --remote-debugging-port=9222 --user-data-dir=c:/temp/chrome-debug
```

#### 3. CORS エラー
```bash
# セキュリティを無効化してChrome起動（開発時のみ）
chrome --remote-debugging-port=9222 --disable-web-security --user-data-dir=c:/temp/chrome-debug
```

## 📊 パフォーマンス監視

### Network API使用例
```javascript
// Network domain有効化
{"id":1,"method":"Network.enable"}

// リクエスト監視
{"id":2,"method":"Network.setRequestInterception","params":{"patterns":[{"urlPattern":"*"}]}}
```

### Console API使用例
```javascript
// Console domain有効化
{"id":1,"method":"Console.enable"}

// Runtime評価実行
{"id":2,"method":"Runtime.evaluate","params":{"expression":"console.log('Claude Code test')"}}
```

## 🔄 継続的な改善

### 1. ログ自動収集
- エラーログの定期的な収集と分析
- パフォーマンス指標の追跡
- ユーザー操作パターンの分析

### 2. 自動化スクリプト
- Chrome Debug Port のヘルスチェック
- 定期的なコンソールクリーンアップ
- エラー発生時の自動スクリーンショット

### 3. 他ツールとの連携
- VSCode拡張機能との統合
- CI/CDパイプラインでの活用
- 自動テストでのコンソール監視

## 📝 使用例テンプレート

### 基本的なデバッグセッション
```bash
#!/bin/bash
# Chrome Debug Port デバッグセッション開始

echo "=== Chrome Debug Port セットアップ ==="

# 1. ポート確認
if ! curl -s http://localhost:9222/json/list >/dev/null 2>&1; then
    echo "Chrome Debug Port が利用できません。起動中..."
    C:/temp/chrome-debug.bat
    sleep 3
fi

# 2. 対象ページ確認
PAGE_ID=$(curl -s http://localhost:9222/json/list | grep "localhost:3000" | sed 's/.*"id":"\([^"]*\)".*/\1/')

if [ -z "$PAGE_ID" ]; then
    echo "localhost:3000 タブを作成中..."
    curl -X PUT "http://localhost:9222/json/new?http://localhost:3000"
    sleep 2
    PAGE_ID=$(curl -s http://localhost:9222/json/list | grep "localhost:3000" | sed 's/.*"id":"\([^"]*\)".*/\1/')
fi

echo "=== デバッグ準備完了 ==="
echo "Page ID: $PAGE_ID"
echo "WebSocket: ws://localhost:9222/devtools/page/$PAGE_ID"
```

## 🎯 ベストプラクティス

### 1. セキュリティ
- 開発環境でのみ使用
- プロダクション環境では無効化
- 適切なファイアウォール設定

### 2. パフォーマンス
- 不要なドメインは無効化
- ログ蓄積の定期的なクリア
- メモリ使用量の監視

### 3. チーム開発
- 共通の設定ファイル使用
- デバッグ手順の文書化
- トラブルシューティングの共有

---

## 📚 参考リンク

- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Remote Debugging](https://developer.chrome.com/docs/devtools/remote-debugging/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

**作成日**: 2025-09-22
**最終更新**: 2025-09-22
**対象環境**: Windows 10/11, Chrome 最新版, Claude Code