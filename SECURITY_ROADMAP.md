# Tasuku セキュリティロードマップ

## 概要
一般公開に向けたエンドツーエンド暗号化（E2E）実装の段階的計画

---

## フェーズ1: テスト期間（現在 - 1-3ヶ月）

### 目的
- 機能完成・安定化を最優先
- DB直接確認によるデバッグ効率維持
- ユーザーフィードバック収集

### 実施事項

#### 必須実装（法的リスク軽減）
- [ ] プライバシーポリシー作成・掲載
  - ベータ版である旨を明記
  - 管理者が技術的にアクセス可能である旨を明示
  - 機密情報入力の非推奨を記載
  - 正式版でE2E暗号化実装予定を告知

- [ ] 利用規約作成・掲載
  - ベータ版利用規約
  - データ保証なし
  - セキュリティは開発中

- [ ] データ削除機能実装
  ```typescript
  // src/app/settings/delete-account.tsx
  async function deleteMyAccount() {
    await supabase.from('unified_tasks').delete().eq('user_id', userId);
    await supabase.from('templates').delete().eq('user_id', userId);
    await supabase.auth.admin.deleteUser(userId);
  }
  ```

- [ ] 問い合わせ窓口設置
  - メールアドレス or GitHub Issues

#### 優先事項
- 機能完成・バグ修正
- DB直接確認でのデバッグ
- データクリーンアップ
- ユーザーフィードバック収集

#### 暗号化関連
- ❌ E2E暗号化実装は**しない**（テスト効率優先）
- ✅ プライバシーポリシーでリスク明示

**実装時間: 1-2日（最低限の対応のみ）**

---

## フェーズ2: 安定期・暗号化実装（機能完成後 - 1ヶ月）

### 前提条件
- ✅ Supabase有料版契約済み
- ✅ 定期バックアップ設定済み
- ✅ 主要バグ修正完了
- ✅ ユーザー数が安定
- ✅ データ構造（スキーマ）確定

### 実施内容

#### 1. E2E暗号化実装（2-4週間）

**技術スタック（全て無料）**
- Web Crypto API（ブラウザ標準）
- IndexedDB（キー保存）
- HMAC Blind Index（検索機能）
- 既存のSupabase（追加費用なし）

**実装項目:**

##### Week 1-2: 暗号化基盤
- [ ] 暗号化ユーティリティ作成（`lib/encryption/crypto.ts`）
  - AES-GCM暗号化/復号化
  - PBKDF2キー導出（600k iterations）
  - Blind Index生成（HMAC）

- [ ] データベース移行スクリプト
  ```sql
  ALTER TABLE unified_tasks
    ADD COLUMN encrypted_memo TEXT,
    ADD COLUMN iv_memo TEXT,
    ADD COLUMN encrypted_urls TEXT,
    ADD COLUMN iv_urls TEXT,
    ADD COLUMN memo_tokens TEXT[];

  CREATE TABLE user_encryption_keys (
    user_id UUID PRIMARY KEY,
    salt TEXT NOT NULL,
    encrypted_master_key TEXT NOT NULL,
    encrypted_index_key TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] キー管理システム
  - パスワードベースのキー導出
  - IndexedDBへのキー保存
  - マルチデバイス同期対応

##### Week 2-3: フロントエンド統合
- [ ] 暗号化セットアップUI
  - 初回登録時のパスワード設定
  - リカバリーキー生成・表示

- [ ] タスク作成/更新の暗号化対応
  - memo/urlsフィールドの自動暗号化
  - titleは平文維持（検索用）

- [ ] タスク表示の復号化対応
  - Lazy decryption（表示時のみ復号化）
  - バッチ復号化（パフォーマンス最適化）

##### Week 3-4: 検索・リカバリー機能
- [ ] Blind Index検索実装
  - memoの単語単位検索
  - PostgreSQL配列クエリ統合

- [ ] リカバリーキーシステム
  - パスワードリセット時のデータ復旧
  - 「リカバリーキーを保存してください」UI

- [ ] データエクスポート/インポート
  - 暗号化データのバックアップ
  - 暗号化キー込みのエクスポート

#### 2. テスト環境での検証（1週間）
- [ ] 開発環境で全機能テスト
- [ ] パフォーマンス測定
- [ ] マルチデバイステスト
- [ ] リカバリーフローテスト

#### 3. データ移行スクリプト準備（3-5日）
```typescript
// scripts/migrate-to-encryption.ts
async function migrateToEncryption() {
  // 1. 全ユーザー取得
  // 2. 各ユーザーに暗号化パスワード設定を促す
  // 3. パスワード設定後、既存memoを暗号化
  // 4. 完了確認
}
```

#### 4. ユーザー通知（2週間前）
- [ ] メール/アプリ内通知
  - 「〇月〇日にセキュリティアップデート実施」
  - 「暗号化パスワードの設定が必要」
  - 「リカバリーキーの保存を忘れずに」

**合計期間: 約1ヶ月**
**追加費用: ¥0**

---

## フェーズ3: 暗号化移行（正式版リリース - 1週間）

### 移行手順

#### Day 1: メンテナンス開始
- [ ] ユーザーに最終通知
- [ ] 新規タスク作成を一時停止（読み取りは可能）
- [ ] データベースバックアップ取得

#### Day 2-5: データ暗号化
- [ ] 各ユーザーにログイン促進
- [ ] 暗号化パスワード設定UI表示
- [ ] リカバリーキー生成・表示（ユーザーが保存）
- [ ] バックグラウンドでmemo/urls暗号化
- [ ] 進捗モニタリング

#### Day 6: 完了確認
- [ ] 全ユーザーの暗号化完了を確認
- [ ] 未完了ユーザーへの個別連絡
- [ ] データ整合性チェック

#### Day 7: 正式版リリース
- [ ] メンテナンスモード解除
- [ ] プライバシーポリシー更新
  - 「E2E暗号化実装済み」
  - 「管理者でもデータが見れない」
- [ ] リリースノート公開

---

## 暗号化仕様（ハイブリッド方式）

### 暗号化対象フィールド
| フィールド | 暗号化 | 理由 |
|----------|-------|------|
| `title` | ❌ 平文 | 検索機能維持、サーバー側タスク生成対応 |
| `category` | ❌ 平文 | フィルタリング、統計処理 |
| `due_date` | ❌ 平文 | ソート、期限管理 |
| `completed` | ❌ 平文 | 統計、ビュー分離 |
| `recurring_pattern` | ❌ 平文 | サーバー側定期タスク生成 |
| **`memo`** | ✅ 暗号化 | **個人情報、詳細メモ** |
| **`urls`** | ✅ 暗号化 | **プライベートURL** |
| **`attachments`** | ✅ 暗号化 | **ファイル（将来実装時）** |

### 技術詳細
- **暗号化アルゴリズム**: AES-256-GCM
- **キー導出**: PBKDF2-SHA256（600,000 iterations）
- **検索**: HMAC Blind Index（単語単位）
- **キー保存**: IndexedDB（クライアント側）
- **マルチデバイス**: 暗号化マスターキーをパスワードで保護してDB保存

### パフォーマンス目標
- タスク暗号化: <10ms/件
- タスク復号化: <10ms/件
- 100件一括復号化: <300ms
- ログイン時キー導出: <500ms（PBKDF2）

---

## リスク管理

### テスト期間中のリスク
| リスク | 対策 |
|-------|------|
| ユーザーデータを管理者が見れる | プライバシーポリシーで明示 |
| 法的責任 | ベータ版として運用、利用規約で免責 |
| データ漏洩 | Supabase RLS有効、HTTPS通信 |

### 暗号化後のリスク
| リスク | 対策 |
|-------|------|
| パスワード忘れ | リカバリーキーシステム |
| 暗号化バグ | バックアップからロールバック可能 |
| パフォーマンス低下 | Lazy decryption、キャッシング |
| 検索精度低下 | Blind Indexで単語単位検索維持 |

---

## 費用見積もり

### テスト期間（フェーズ1）
- Supabase無料枠: ¥0
- 開発費用: ¥0（自己開発）
- **合計: ¥0/月**

### 正式版（フェーズ2以降）
- Supabase有料版（Pro）: $25/月（約¥3,750）
- 暗号化実装費用: ¥0（Web Crypto API、オープンソース）
- **合計: 約¥3,750/月**

**追加費用なし（既存のSupabase費用のみ）**

---

## 参考リソース

### 技術ドキュメント
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [OWASP Key Derivation](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### オープンソース参考実装
- [Standard Notes](https://github.com/standardnotes/app) - E2E暗号化ノートアプリ
- [Joplin](https://github.com/laurent22/joplin) - E2E暗号化タスク管理
- [CryptPad](https://github.com/cryptpad/cryptpad) - ゼロ知識アーキテクチャ

### ライブラリ
- Web Crypto API（ブラウザ標準）
- [idb](https://github.com/jakearchibald/idb) - IndexedDB wrapper（MIT License）
- [tweetnacl](https://github.com/dchest/tweetnacl-js) - 軽量暗号化（オプション、MIT License）

---

## 意思決定ログ

### 2025-10-01: 段階的実装の決定
**決定事項:**
- テスト期間中は暗号化を実装せず、DB直接確認を維持
- 機能完成・安定化後にE2E暗号化を実装
- ハイブリッド方式（memo/urlsのみ暗号化）を採用

**理由:**
- テスト効率の維持（バグ調査、データクリーンアップ）
- データ構造の確定を待つ（頻繁なスキーマ変更への対応コスト削減）
- バックアップ体制の整備（有料版契約後）
- ユーザー数の把握（計画的な移行実施のため）

**検討した代替案:**
1. 最初からE2E暗号化実装 → テスト効率低下のため却下
2. 暗号化なし永続運用 → 一般公開時の信頼性・法的リスクのため却下
3. フルE2E暗号化 → 検索機能・タスク生成の制約が大きいため却下

---

## ステータス

**現在のフェーズ: フェーズ1（テスト期間）**

**次のアクション:**
1. プライバシーポリシー作成（1-2日）
2. データ削除機能実装（1日）
3. 機能テスト・バグ修正に集中

**フェーズ2移行の判断基準:**
- [ ] 主要機能完成
- [ ] 重大バグゼロ（1週間以上）
- [ ] Supabase有料版契約
- [ ] バックアップ体制確立
- [ ] ユーザー数が安定（目標: 10-100名）

---

最終更新: 2025-10-01