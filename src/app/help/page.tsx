'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function HelpPage() {
  useEffect(() => {
    document.title = 'TASUKU - 使い方'
  }, [])

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
      backgroundColor: '#ffffff',
      minHeight: '100vh',
      lineHeight: 1.7
    }}>
      {/* ヘッダー */}
      <header style={{
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <Link href="/today" style={{
            display: 'inline-flex',
            alignItems: 'center',
            color: '#3b82f6',
            textDecoration: 'none',
            fontSize: '14px',
            padding: '8px 16px',
            border: '1px solid #3b82f6',
            borderRadius: '6px',
            transition: 'all 0.2s'
          }}>
            ← ホームに戻る
          </Link>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>
            📋 TASUKU 使い方ガイド
          </h1>
        </div>
      </header>

      {/* 目次 */}
      <nav style={{
        backgroundColor: '#f8fafc',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '32px',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{ fontSize: '20px', color: '#374151', marginTop: 0, marginBottom: '16px' }}>📖 目次</h2>
        <ol style={{ margin: 0, paddingLeft: '20px', color: '#6b7280' }}>
          <li style={{ marginBottom: '8px' }}><a href="#about" style={{ color: '#3b82f6', textDecoration: 'none' }}>TASUKUについて</a></li>
          <li style={{ marginBottom: '8px' }}><a href="#pages" style={{ color: '#3b82f6', textDecoration: 'none' }}>各ページの使い方</a></li>
          <li style={{ marginBottom: '8px' }}><a href="#create" style={{ color: '#3b82f6', textDecoration: 'none' }}>タスクの作成</a></li>
          <li style={{ marginBottom: '8px' }}><a href="#manage" style={{ color: '#3b82f6', textDecoration: 'none' }}>タスクの管理</a></li>
          <li style={{ marginBottom: '8px' }}><a href="#shopping" style={{ color: '#3b82f6', textDecoration: 'none' }}>買い物機能</a></li>
          <li style={{ marginBottom: '8px' }}><a href="#features" style={{ color: '#3b82f6', textDecoration: 'none' }}>便利な機能</a></li>
          <li style={{ marginBottom: '8px' }}><a href="#security" style={{ color: '#3b82f6', textDecoration: 'none' }}>セキュリティについて</a></li>
          <li><a href="#faq" style={{ color: '#3b82f6', textDecoration: 'none' }}>よくある質問</a></li>
        </ol>
      </nav>

      {/* 1. TASUKUについて */}
      <section id="about" style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
          1. TASUKUについて
        </h2>
        <p style={{ color: '#374151', marginBottom: '16px' }}>
          TASUKUは、日々のタスク管理を効率化するWebアプリケーションです。
        </p>
        <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
          <h3 style={{ fontSize: '16px', color: '#0369a1', marginTop: 0, marginBottom: '12px' }}>主な機能</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
            <li>今日やるタスクの一覧表示・時間軸ソート</li>
            <li>繰り返しタスクの自動生成</li>
            <li>買い物リストの管理と自動繰り越し</li>
            <li>タスクの完了履歴・統計確認</li>
            <li>URL一括オープン・ファイル添付</li>
          </ul>
        </div>
      </section>

      {/* 2. 各ページの使い方 */}
      <section id="pages" style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
          2. 各ページの使い方
        </h2>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>📅 今日のタスク（/today）</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>メインページ。今日やるべきタスクを管理します。</p>

        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: 0, marginBottom: '8px' }}>表示内容</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
            <li><strong>今日のタスク</strong>：重要度順または時間軸順で表示</li>
            <li><strong>期限切れタスク</strong>：折りたたみ可能</li>
            <li><strong>明日以降のタスク</strong>：先の予定を確認</li>
            <li><strong>買い物タスク</strong>：期日なし買い物リスト</li>
            <li><strong>やることリスト</strong>：期限のないアイデア・メモ</li>
          </ul>
        </div>

        <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '16px', color: '#dc2626', marginTop: 0, marginBottom: '8px' }}>ソート機能</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
            <li><strong>重要度モード</strong>：重要度5→1の順で表示</li>
            <li><strong>時間軸モード</strong>：🌅9時まで、☀️13時まで、🌤️18時まで、🌙24時までの4つの時間枠に分割表示</li>
          </ul>
        </div>

        <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '16px', color: '#059669', marginTop: 0, marginBottom: '8px' }}>カテゴリフィルター</h4>
          <p style={{ margin: 0, color: '#374151' }}>
            🏷️フィルターボタンから特定のカテゴリのみを表示できます。「今日のタスク」と「やることリスト」に適用されます。
          </p>
        </div>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>🔍 検索（/search）</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>過去のタスクを検索できます。</p>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li>タスク名・メモで検索</li>
          <li>カテゴリで絞り込み</li>
          <li>完了/未完了で絞り込み</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>📊 統計（/statistics）</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>タスク達成状況を可視化します。</p>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li>完了タスク数の推移グラフ</li>
          <li>カテゴリ別統計</li>
          <li>繰り返しタスク達成率</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>⚙️ テンプレート管理（/templates）</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>繰り返しタスクの設定を編集します。</p>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li>パターン（毎日/毎週/毎月/毎年）の変更</li>
          <li>曜日・日付の変更</li>
          <li>有効/無効の切り替え</li>
          <li>テンプレート削除</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>📋 完了タスク（/done）</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>完了したタスクの履歴を確認します。</p>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li>今日・今週・今月・全て の期間フィルター</li>
          <li>繰り返しタスクの達成カレンダー</li>
          <li>連続達成日数・達成率</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>📥 受信箱（/inbox）</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>分類前のタスクを一時保管します。</p>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li>思いついたアイデアを素早く記録</li>
          <li>後でカテゴリや期日を設定</li>
        </ul>
      </section>

      {/* 3. タスクの作成 */}
      <section id="create" style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
          3. タスクの作成
        </h2>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>3-1. タスクタイプの選択</h3>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          「+ タスク追加」をクリック後、2つのタイプから選択します：
        </p>

        <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
          <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#059669' }}>📅 通常タスク</h4>
            <p style={{ margin: 0, color: '#374151' }}>特定の日付に実行するタスク<br/>例）1/15 会議資料準備、～1/20 報告書提出</p>
          </div>

          <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#2563eb' }}>🔄 繰り返しタスク</h4>
            <p style={{ margin: 0, color: '#374151' }}>毎日/毎週 自動生成されるタスク<br/>例）毎朝8:00 ゴミ出し、毎週月曜 定例会議</p>
          </div>
        </div>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>3-2. 基本情報の入力</h3>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>必須項目</h4>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li><strong>タスク名</strong>：何をするか</li>
          <li><strong>期日</strong>：いつやるか（繰り返しタスクは不要）</li>
        </ul>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>任意項目</h4>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li><strong>メモ</strong>：補足説明（📝アイコンをクリックでポップアップ表示）</li>
          <li><strong>カテゴリ</strong>：仕事/買い物/プライベート等</li>
          <li><strong>重要度</strong>：1～5（数字が大きいほど重要）</li>
          <li><strong>開始時間・終了時間</strong>：時間軸ソートに使用</li>
          <li><strong>URL</strong>：参考リンク（最大5個、🌍アイコンで一括オープン）</li>
          <li><strong>ファイル添付</strong>：画像・PDFなど（📷アイコンで表示）</li>
          <li><strong>買い物リスト</strong>：カテゴリ「買い物」選択時のみ</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>3-3. 繰り返しタスクの設定</h3>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>パターン選択</h4>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li><strong>毎日</strong>：毎日表示</li>
          <li><strong>毎週</strong>：曜日を複数選択可能</li>
          <li><strong>毎月</strong>：日付を指定（1～31日）</li>
          <li><strong>毎年</strong>：月日を指定</li>
        </ul>

        <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#059669' }}>設定例</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
            <li>毎週月・水・金 → 月水金のみ表示</li>
            <li>毎月1日 + 開始時間9:00 → 毎月1日の9時枠に表示</li>
          </ul>
        </div>
      </section>

      {/* 4. タスクの管理 */}
      <section id="manage" style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
          4. タスクの管理
        </h2>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>4-1. タスクの完了</h3>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          左のチェックボックスをクリック → リストから消えて完了タスクセクションに移動します。
        </p>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>4-2. タスクの編集</h3>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          ✏️ボタンをクリック → 編集フォームが画面下部に表示 → 内容を変更して「保存」
        </p>
        <div style={{ backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '16px' }}>
          <p style={{ margin: 0, color: '#374151' }}>
            <strong>繰り返しタスクの編集：</strong>編集すると、テンプレートも同時に更新されます。既に生成済みの他の日のタスクには影響しません。
          </p>
        </div>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>4-3. タスクの削除</h3>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          🗑️ボタンをクリック → 確認ダイアログ表示 → 「削除」で完全削除（復元不可）
        </p>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>4-4. メモの確認</h3>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          📝アイコンをクリック → メモがポップアップで全文表示されます。
        </p>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>4-5. モバイル表示</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          スマートフォンでは、以下の項目が最適化されています：
        </p>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li>カード形式で見やすく表示</li>
          <li>カテゴリ表示を省略（フィルター機能は利用可能）</li>
          <li>タップしやすい大きめのボタン</li>
        </ul>
      </section>

      {/* 5. 買い物機能 */}
      <section id="shopping" style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
          5. 買い物機能
        </h2>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>5-1. 買い物タスクの作成</h3>
        <ol style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li>「+ タスク追加」をクリック</li>
          <li>カテゴリで「買い物」を選択</li>
          <li>買い物リストに商品名を入力</li>
          <li>Enterまたは「追加」で次の商品入力</li>
          <li>期日を設定（任意：期日なしも可能）</li>
        </ol>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>5-2. 買い物リストの使い方</h3>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li><strong>リストを開く</strong>：🛒 リストボタンをクリック</li>
          <li><strong>購入済みチェック</strong>：各商品のチェックボックスをクリック</li>
          <li><strong>商品を編集</strong>：商品名をクリック</li>
          <li><strong>商品を追加</strong>：入力欄から追加</li>
          <li><strong>商品を削除</strong>：🗑️アイコンをクリック</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>5-3. 自動繰り越し機能</h3>
        <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <p style={{ margin: '0 0 12px 0', color: '#374151' }}>買い物タスクを完了した翌日：</p>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
            <li>全商品チェック済み → そのまま完了</li>
            <li>未チェック商品あり → 期日なし買い物タスクとして自動繰り越し</li>
          </ul>
          <p style={{ margin: '12px 0 0 0', color: '#374151' }}>
            ※ 繰り越しは翌日の最初のアクセス時に自動実行されます。
          </p>
        </div>
      </section>

      {/* 6. 便利な機能 */}
      <section id="features" style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
          6. 便利な機能
        </h2>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>6-1. URL一括オープン</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          🌍 アイコンをクリック → 登録された全URLが新しいタブで一括オープン
        </p>
        <p style={{ color: '#6b7280', marginBottom: '8px' }}>用途：</p>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li>Zoomミーティングリンク</li>
          <li>参考資料・ドキュメント</li>
          <li>複数の関連ページ</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>6-2. ファイル添付</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          タスク作成時に画像・PDFを添付可能
        </p>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          📷 アイコンをクリック → ポップアップでプレビュー表示 → ダウンロードも可能
        </p>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>6-3. 重要度表示</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          ● 色付きドットで視覚的に表示
        </p>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li><span style={{ color: '#dc2626' }}>●</span> 5（赤）：最優先</li>
          <li><span style={{ color: '#ea580c' }}>●</span> 4（橙）：重要</li>
          <li><span style={{ color: '#ca8a04' }}>●</span> 3（黄）：通常</li>
          <li><span style={{ color: '#16a34a' }}>●</span> 2（緑）：余裕あり</li>
          <li><span style={{ color: '#2563eb' }}>●</span> 1（青）：低優先度</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>6-4. 階層表示</h3>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          セクション（期限切れ、明日以降など）内のタスクは右にインデントされ、見やすく階層化されています。
        </p>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>6-5. タスク更新ボタン</h3>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          画面右上の「🔄 タスク更新」ボタンで、繰り返しタスクの生成を手動実行できます。
        </p>
      </section>

      {/* 7. セキュリティについて */}
      <section id="security" style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
          7. セキュリティについて
        </h2>

        <div style={{ backgroundColor: '#fef2f2', padding: '20px', borderRadius: '8px', border: '2px solid #fecaca', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', color: '#dc2626', marginTop: 0, marginBottom: '12px' }}>⚠️ 重要なお知らせ</h3>
          <p style={{ color: '#374151', margin: '0 0 12px 0', fontWeight: 'bold' }}>
            本アプリケーションは現在β版テスト運用中です。
          </p>
          <p style={{ color: '#374151', margin: 0 }}>
            正式版リリースに向けて、実際の利用環境での動作確認を行っている段階となります。
          </p>
        </div>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>7-1. データの暗号化について</h3>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>β版（現在）</h4>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          現在テスト運用中のため、タスクデータの暗号化処理は実装されていません。これは運用テストを円滑に進めるための措置です。
        </p>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          そのため、データベース管理者がタスクの内容を技術的に確認できる状態となっています。ただし、関係者が直接タスク内容を見ることはありません。また、ユーザー同士のデータについては、Row Level Security（RLS）により完全に分離されており、他のユーザーがあなたのタスクを見ることは一切できません。
        </p>

        <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '16px' }}>
          <p style={{ margin: 0, color: '#374151', fontWeight: 'bold' }}>
            β版では個人情報に関わるような内容をタスクに記載しないようお願いいたします。
          </p>
        </div>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>正式版（今後の予定）</h4>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          正式版移行時には、すべてのタスクデータが暗号化されます。管理者を含めて誰もタスクの内容を確認できなくなります。
        </p>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          ただし、暗号化により、ログイン情報を紛失した場合のデータ復旧ができなくなります。Googleアカウントの管理には十分ご注意ください。
        </p>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>7-2. β版利用時の注意事項</h3>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>記載を避けるべき情報</h4>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li>氏名・住所・電話番号などの個人情報</li>
          <li>クレジットカード番号や銀行口座情報</li>
          <li>パスワードやアクセストークン</li>
          <li>社外秘情報などの機密情報</li>
        </ul>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>推奨される使い方</h4>
        <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
            <li>「買い物に行く」「掃除をする」といった日常的なタスク</li>
            <li>「資料作成」「会議準備」などの概要的な業務タスク</li>
            <li>「運動する」「本を読む」といった習慣タスク</li>
          </ul>
        </div>
      </section>

      {/* 8. よくある質問 */}
      <section id="faq" style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
          8. よくある質問
        </h2>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', color: '#374151', marginBottom: '8px' }}>Q. 繰り返しタスクが表示されない</h3>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: 0, color: '#6b7280' }}>
              A. 画面右上の「🔄 タスク更新」ボタンをクリックしてください。それでも表示されない場合は、テンプレート管理（⚙️）で該当タスクが有効か確認してください。
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', color: '#374151', marginBottom: '8px' }}>Q. タスクを間違えて削除した</h3>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: 0, color: '#6b7280' }}>
              A. 削除の取り消しはできません。新しく作成し直してください。
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', color: '#374151', marginBottom: '8px' }}>Q. 期日切れタスクが溜まっている</h3>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: 0, color: '#6b7280' }}>
              A. タスクを編集して期日を削除すると、「やることリスト」に移動します。期日のプレッシャーから解放されます。
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', color: '#374151', marginBottom: '8px' }}>Q. メモ列の📝アイコンが表示されない</h3>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: 0, color: '#6b7280' }}>
              A. メモが空のタスクには📝アイコンが表示されません。タスクを編集してメモを追加してください。
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', color: '#374151', marginBottom: '8px' }}>Q. スマホでカテゴリが表示されない</h3>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: 0, color: '#6b7280' }}>
              A. モバイル表示では、画面を見やすくするためカテゴリ表示を省略しています。カテゴリフィルター機能は引き続き利用可能です。
            </p>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer style={{
        textAlign: 'center',
        padding: '24px 0',
        borderTop: '2px solid #e5e7eb',
        color: '#6b7280'
      }}>
        <p style={{ margin: 0 }}>
          TASUKUで効率的なタスク管理を始めましょう！
          <Link href="/today" style={{ color: '#3b82f6', textDecoration: 'none', marginLeft: '8px' }}>
            → 今日のタスクに戻る
          </Link>
        </p>
      </footer>
    </div>
  )
}
