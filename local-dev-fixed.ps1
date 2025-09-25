# Tasuku ローカル開発スクリプト
# 使用方法: .\local-dev.ps1 [ポート] [コマンド]

param(
    [int]$Port = 3000,
    [string]$Command = "dev"
)

Write-Host "🚀 Tasuku 開発サーバーを起動中..." -ForegroundColor Green
Write-Host "ポート: $Port" -ForegroundColor Yellow
Write-Host "コマンド: npm run $Command" -ForegroundColor Yellow

# PORT環境変数を設定
$env:PORT = $Port

# 開発サーバーを起動
switch ($Command) {
    "dev" {
        Write-Host "Next.js 開発サーバーを起動中..." -ForegroundColor Cyan
        npm run dev
    }
    "build" {
        Write-Host "アプリケーションをビルド中..." -ForegroundColor Cyan
        npm run build
    }
    "start" {
        Write-Host "本番サーバーを起動中..." -ForegroundColor Cyan
        npm run start
    }
    "lint" {
        Write-Host "リンターを実行中..." -ForegroundColor Cyan
        npm run lint
    }
    "type-check" {
        Write-Host "型チェックを実行中..." -ForegroundColor Cyan
        npm run type-check
    }
    default {
        Write-Host "カスタムコマンドを実行中: npm run $Command" -ForegroundColor Cyan
        npm run $Command
    }
}

# 少し待ってからブラウザを開く
if ($Command -eq "dev") {
    Start-Sleep -Seconds 3
    Write-Host "ブラウザを開いています: http://localhost:$Port" -ForegroundColor Green
    start "http://localhost:$Port"
}
