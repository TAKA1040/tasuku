# tasuku (タスク管理アプリ)

シンプルで使いやすいタスク管理Webアプリケーション

## 🌐 本番環境

https://tasuku.apaf.me

## 📖 概要

tasukuは、日々のタスクを効率的に管理するためのWebアプリケーションです。
Google認証によるセキュアなログイン、繰り返しタスクの自動生成、買い物リスト管理など、実用的な機能を備えています。

## ✨ 主な機能

### 📋 タスク管理
- **今日のタスク**: 本日期限のタスクを一覧表示
- **明日以降のタスク**: 将来の予定を管理
- **期限切れタスク**:
  - 通常タスクと繰り返しタスクを分離表示
  - 繰り返しタスクは二重折りたたみでスッキリ表示
  - 自動削除機能で古い期限切れタスクを整理
- **やることリスト**: 期限なしのタスク管理

### 🔄 繰り返しタスク
- **自動生成**: 毎日、週次、月次のタスクを自動生成
- **生成期間**:
  - 日次: 今日を含めた3日間（今日、昨日、一昨日）
  - 週次: 先週の月曜日〜翌週の日曜日まで（14日分）
  - 月次: 1年前から1年後の前日まで（約730日分）
- **自動削除**:
  - 日次タスク: 期限から3日経過で自動削除
  - 週次タスク: 期限から7日経過で自動削除
  - 月次タスク: 期限から365日経過で自動削除

### 🛒 買い物リスト
- サブタスク機能による詳細な買い物リスト作成
- 完了時の未完了アイテム自動繰り越し

### 📊 統計・分析
- タスク完了率の可視化
- 30日カレンダー表示による達成記録追跡
- 連続達成日数の表示

### 🎨 UI/UX
- ダークモード対応
- レスポンシブデザイン（モバイル・タブレット・デスクトップ対応）
- ソート機能（重要度順・時間軸順）

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 15.5.3** (App Router)
- **React 19** (RC)
- **TypeScript**

### バックエンド・インフラ
- **Supabase** (PostgreSQL, 認証)
- **Vercel** (ホスティング・デプロイ)

### 認証
- Google OAuth 2.0

## 🚀 デプロイ

デプロイは専用のworktreeを使用して行います。

```bash
# デプロイ用worktreeに移動
cd ../tasuku-deploy

# 最新のmainブランチを取得
git fetch origin --prune
git reset --hard origin/main

# 本番デプロイ
vercel --prod --yes

# デプロイ確認
vercel inspect <Production URL>
```

## 📝 開発

### ローカル開発環境

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 型チェック
npm run type-check

# Lint
npm run lint
```

### 環境変数

`.env.local` に以下の環境変数を設定してください:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

## 📁 プロジェクト構造

```
tasuku/
├── src/
│   ├── app/              # Next.js App Router ページ
│   ├── components/       # Reactコンポーネント
│   ├── hooks/           # カスタムフック
│   ├── lib/
│   │   ├── db/          # データベースサービス層
│   │   ├── services/    # ビジネスロジック
│   │   ├── supabase/    # Supabase クライアント
│   │   └── utils/       # ユーティリティ関数
│   └── types/           # TypeScript型定義
├── supabase/            # Supabase設定・マイグレーション
├── WORK_HISTORY.md      # 作業履歴（重要なルール記録）
└── README.md
```

## 🔐 セキュリティ

- **Row Level Security (RLS)**: Supabaseのテーブルレベルでユーザーデータを保護
- **ユーザー分離**: 全てのクエリで `user_id` フィルターを適用
- **Google認証**: OAuth 2.0による安全なログイン

## 📚 ドキュメント

- **WORK_HISTORY.md**: 作業履歴と重要なルール（生成期間、削除ルールなど）
- **PROJECT_STATUS.md**: プロジェクトの現状と課題
- **SECURITY_AND_CI_DECLARATION.md**: セキュリティとCI/CD方針

## 🐛 既知の問題

既知の問題については `PROJECT_STATUS.md` を参照してください。

## 📄 ライセンス

MIT

## 👤 作成者

TAKA1040

---

**Last Updated**: 2025-10-02
