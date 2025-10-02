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
          <li style={{ marginBottom: '8px' }}><a href="#screen" style={{ color: '#3b82f6', textDecoration: 'none' }}>画面の見方</a></li>
          <li style={{ marginBottom: '8px' }}>
            <a href="#create" style={{ color: '#3b82f6', textDecoration: 'none' }}>タスクの作成</a>
            <ul style={{ marginTop: '4px', listStyleType: 'circle' }}>
              <li><a href="#create-type" style={{ color: '#3b82f6', textDecoration: 'none' }}>タスクタイプの選択</a></li>
              <li><a href="#create-info" style={{ color: '#3b82f6', textDecoration: 'none' }}>基本情報の入力</a></li>
              <li><a href="#create-recurring" style={{ color: '#3b82f6', textDecoration: 'none' }}>繰り返しタスクの設定</a></li>
            </ul>
          </li>
          <li style={{ marginBottom: '8px' }}>
            <a href="#manage" style={{ color: '#3b82f6', textDecoration: 'none' }}>タスクの管理</a>
            <ul style={{ marginTop: '4px', listStyleType: 'circle' }}>
              <li><a href="#manage-today" style={{ color: '#3b82f6', textDecoration: 'none' }}>今日のタスク画面</a></li>
              <li><a href="#manage-sort" style={{ color: '#3b82f6', textDecoration: 'none' }}>ソート機能</a></li>
              <li><a href="#manage-action" style={{ color: '#3b82f6', textDecoration: 'none' }}>完了・編集・削除</a></li>
            </ul>
          </li>
          <li style={{ marginBottom: '8px' }}><a href="#shopping" style={{ color: '#3b82f6', textDecoration: 'none' }}>買い物機能</a></li>
          <li style={{ marginBottom: '8px' }}><a href="#ideas" style={{ color: '#3b82f6', textDecoration: 'none' }}>やることリスト</a></li>
          <li style={{ marginBottom: '8px' }}><a href="#done" style={{ color: '#3b82f6', textDecoration: 'none' }}>完了タスクの確認</a></li>
          <li style={{ marginBottom: '8px' }}><a href="#template" style={{ color: '#3b82f6', textDecoration: 'none' }}>テンプレート管理</a></li>
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
            <li>今日やるタスクの一覧表示</li>
            <li>繰り返しタスクの自動生成</li>
            <li>買い物リストの管理</li>
            <li>タスクの完了履歴確認</li>
          </ul>
        </div>
      </section>

      {/* 2. 画面の見方 */}
      <section id="screen" style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
          2. 画面の見方
        </h2>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>ヘッダー（画面上部）</h3>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li><strong>左側</strong>：今日の日付</li>
          <li><strong>中央</strong>：「+ タスク追加」ボタン</li>
          <li><strong>右側</strong>：⚙️テンプレート管理、📋完了タスク</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>メイン画面</h3>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li>今日のタスク一覧</li>
          <li>買い物セクション（期日なし買い物タスク）</li>
          <li>やることリスト（表示/非表示切替可）</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>タスク表示</h3>
        <div style={{ backgroundColor: '#fefce8', padding: '16px', borderRadius: '8px', border: '1px solid #fde047' }}>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
            <li>□ チェックボックス：完了マーク</li>
            <li>● 重要度ドット（色で表示）</li>
            <li>タスク名</li>
            <li>📷 添付ファイルアイコン</li>
            <li>🌍 URLアイコン</li>
            <li>🛒 買い物リストアイコン</li>
            <li>メモ（小さい文字）</li>
            <li>✏️編集 🗑️削除ボタン</li>
          </ul>
        </div>
      </section>

      {/* 3. タスクの作成 */}
      <section id="create" style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
          3. タスクの作成
        </h2>

        <h3 id="create-type" style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>3-1. タスクタイプの選択</h3>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          「+ タスク追加」をクリック後、3つのタイプから選択します：
        </p>

        <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
          <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#059669' }}>📅 指定日にやる</h4>
            <p style={{ margin: 0, color: '#374151' }}>特定の日付に実行するタスク<br/>例）1/15 会議資料準備</p>
          </div>

          <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>⏰ 期限を決める</h4>
            <p style={{ margin: 0, color: '#374151' }}>この日までに完了するタスク<br/>例）～1/20 報告書提出</p>
          </div>

          <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#2563eb' }}>🔄 繰り返しやる</h4>
            <p style={{ margin: 0, color: '#374151' }}>毎日/毎週 自動生成されるタスク<br/>例）毎朝8:00 ゴミ出し</p>
          </div>
        </div>

        <h3 id="create-info" style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>3-2. 基本情報の入力</h3>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>必須項目</h4>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li><strong>タスク名</strong>：何をするか</li>
          <li><strong>期日</strong>：いつやるか（繰り返しタスクは不要）</li>
        </ul>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>任意項目</h4>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li><strong>メモ</strong>：補足説明</li>
          <li><strong>カテゴリ</strong>：仕事/買い物/プライベート等</li>
          <li><strong>重要度</strong>：1～5（数字が大きいほど重要）</li>
          <li><strong>開始時間・終了時間</strong>：時間軸ソートに使用</li>
          <li><strong>URL</strong>：参考リンク（最大5個）</li>
          <li><strong>ファイル添付</strong>：画像・PDFなど</li>
        </ul>

        <h3 id="create-recurring" style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>3-3. 繰り返しタスクの設定</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          タスクタイプで「🔄 繰り返しやる」を選択時：
        </p>

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
            <li>毎月1日 → 毎月1日に表示</li>
          </ul>
        </div>
      </section>

      {/* 4. タスクの管理 */}
      <section id="manage" style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
          4. タスクの管理
        </h2>

        <h3 id="manage-today" style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>4-1. 今日のタスク画面</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>表示されるタスク：</p>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li>今日が期日のタスク</li>
          <li>繰り返しタスク（今日生成分）</li>
          <li>期日のない買い物タスク（🛒セクション）</li>
        </ul>

        <h3 id="manage-sort" style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>4-2. ソート機能</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>画面上部のボタンで切り替え：</p>

        <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
          <div style={{ backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <strong style={{ color: '#dc2626' }}>「重要度」ボタン（デフォルト）</strong>
            <p style={{ margin: '4px 0 0 0', color: '#374151' }}>重要度5→4→3→2→1→なしの順</p>
          </div>

          <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <strong style={{ color: '#2563eb' }}>「時間軸」ボタン</strong>
            <p style={{ margin: '4px 0 0 0', color: '#374151' }}>開始時間の早い順（時間未設定は最後）</p>
          </div>
        </div>

        <h3 id="manage-action" style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>4-3. タスクの完了・編集・削除</h3>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>完了する</h4>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          左のチェックボックスをクリック → 完了タスクセクションに移動
        </p>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>編集する</h4>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          ✏️ボタンをクリック → 編集フォームが開く → 内容を変更して保存
        </p>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>削除する</h4>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          🗑️ボタンをクリック → 確認ダイアログ表示 → 「削除」をクリックで削除
        </p>
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
          <li>期日を設定（任意）</li>
        </ol>

        <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '16px' }}>
          <p style={{ margin: 0, color: '#374151' }}>
            <strong>※ 重要：</strong>買い物リストはメモ欄に表示されません
          </p>
        </div>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>5-2. 買い物リストの使い方</h3>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>リストを開く</h4>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          🛒 アイコンをクリック → 買い物リスト展開
        </p>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>購入済みをチェック</h4>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          各商品の左チェックボックスをクリック → 取り消し線が表示される
        </p>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>商品を追加・編集</h4>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li>商品名をクリック → 編集</li>
          <li>新しい商品を入力欄から追加</li>
          <li>🗑️で削除</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>5-3. 自動繰り越し</h3>
        <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <p style={{ margin: '0 0 12px 0', color: '#374151' }}>タスク完了時：</p>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
            <li>全商品チェック済み → 完了</li>
            <li>未チェック商品あり → 期日なしタスクとして再作成</li>
          </ul>
          <p style={{ margin: '12px 0 0 0', color: '#374151' }}>チェック済み商品は完了タスクに残ります</p>
        </div>
      </section>

      {/* 6. やることリスト */}
      <section id="ideas" style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
          6. やることリスト
        </h2>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>6-1. アイデアの記録</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          「表示する」にチェック → やることリストセクション表示
        </p>

        <p style={{ color: '#6b7280', marginBottom: '8px' }}>用途：</p>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li>期限なしのアイデア</li>
          <li>いつかやりたいこと</li>
          <li>メモ代わり</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>6-2. タスクへの昇格</h3>
        <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe', marginBottom: '16px' }}>
          <p style={{ margin: '0 0 12px 0', color: '#374151' }}>📋 ボタンをクリック</p>
          <p style={{ margin: '0 0 4px 0', color: '#374151' }}>↓</p>
          <p style={{ margin: '0 0 12px 0', color: '#374151' }}>タスク作成フォームが開く（タイトルは自動入力済み）</p>
          <p style={{ margin: '0 0 4px 0', color: '#374151' }}>↓</p>
          <p style={{ margin: '0 0 12px 0', color: '#374151' }}>タイプ・期日・詳細を追加</p>
          <p style={{ margin: '0 0 4px 0', color: '#374151' }}>↓</p>
          <p style={{ margin: 0, color: '#374151' }}>保存すると元のアイデアは削除</p>
        </div>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>期日切れタスクからの移動</h4>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          「やることリストへ」ボタン → 期日を削除してリストに移動
        </p>
      </section>

      {/* 7. 完了タスクの確認 */}
      <section id="done" style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
          7. 完了タスクの確認
        </h2>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>7-1. 期間フィルター</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          右上「📋 完了タスク」をクリック → 完了タスクページ表示
        </p>

        <p style={{ color: '#6b7280', marginBottom: '8px' }}>フィルター選択：</p>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li>今日</li>
          <li>今週</li>
          <li>今月</li>
          <li>全て</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>7-2. 達成度カレンダー</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          繰り返しタスクの達成状況を表示：
        </p>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li>30日カレンダー</li>
          <li>連続達成日数</li>
          <li>達成率（直近7日・全期間）</li>
        </ul>
      </section>

      {/* 8. テンプレート管理 */}
      <section id="template" style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
          8. テンプレート管理
        </h2>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>8-1. 繰り返しタスクの編集</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          右上 ⚙️ ボタンをクリック → テンプレート一覧表示
        </p>

        <p style={{ color: '#6b7280', marginBottom: '8px' }}>編集可能項目：</p>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li>タイトル・メモ</li>
          <li>パターン（毎日/毎週/毎月/毎年）</li>
          <li>曜日指定（毎週のみ）</li>
          <li>重要度・カテゴリ</li>
          <li>URL・添付ファイル</li>
          <li>開始時間・終了時間</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>8-2. 有効/無効の切り替え</h3>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          「有効」トグルをクリック → 一時的に自動生成を停止
        </p>

        <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>注意</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
            <li>既に生成済みのタスクは変更されません</li>
            <li>次回生成から反映されます</li>
          </ul>
        </div>
      </section>

      {/* 9. 便利な機能 */}
      <section id="features" style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
          9. 便利な機能
        </h2>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>9-1. URL一括オープン</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          🌍 アイコンをクリック → 登録された全URLが新しいタブで開く
        </p>
        <p style={{ color: '#6b7280', marginBottom: '8px' }}>用途：</p>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li>Zoomミーティングリンク</li>
          <li>参考資料URL</li>
          <li>複数の関連ページ</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>9-2. ファイル添付</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          タスク作成時に画像・PDFを添付
        </p>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          📷 アイコンをクリック → ポップアップでプレビュー表示 → ダウンロードも可能
        </p>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>9-3. 重要度表示</h3>
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
      </section>

      {/* 10. セキュリティについて */}
      <section id="security" style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
          10. セキュリティについて
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

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>10-1. データの暗号化について</h3>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>β版（現在）</h4>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          現在テスト運用中のため、タスクデータの暗号化処理は実装されていません。これは運用テストを円滑に進めるための意図的な措置です。暗号化してしまうと、テスト段階での問題発見や改善が困難になるため、この判断を行っています。
        </p>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          そのため、現在の状態ではデータベース管理者がタスクの内容を技術的に確認できる状態となっています。ただし、関係者が直接タスク内容を見ることはありません。また、ユーザー同士のデータについては、Row Level Security（RLS）という仕組みにより完全に分離されており、他のユーザーがあなたのタスクを見ることは一切できません。
        </p>

        <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '16px' }}>
          <p style={{ margin: 0, color: '#374151', fontWeight: 'bold' }}>
            このような理由から、β版では個人情報に関わるような内容をタスクに記載しないようお願いいたします。
          </p>
        </div>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>正式版（今後の予定）</h4>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          正式版に移行した際には、すべてのタスクデータが暗号化されます。暗号化が実装されると、管理者を含めて誰もタスクの内容を確認することができなくなり、セキュリティ面が大幅に向上します。
        </p>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          ただし、暗号化によりセキュリティが向上する一方で、ログイン情報を紛失した場合のデータ復旧ができなくなります。具体的には、ログインしたアカウントがわからなくなってしまった場合、そのアカウントで作成したタスクを見ることができなくなってしまいます。このような場合、データの復旧はできませんので、Googleアカウントの管理には十分ご注意ください。
        </p>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>10-2. β版利用時の注意事項</h3>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>記載を避けるべき情報</h4>
        <p style={{ color: '#6b7280', marginBottom: '8px' }}>
          現在は暗号化が実装されていないため、個人を特定できるような情報や機密性の高い情報は記載しないようお願いします。
        </p>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li>氏名・住所・電話番号などの個人情報</li>
          <li>クレジットカード番号や銀行口座情報</li>
          <li>パスワードやアクセストークン</li>
          <li>社外秘情報などの機密情報</li>
          <li>プライバシーに関わる詳細な内容</li>
        </ul>

        <h4 style={{ fontSize: '16px', color: '#4b5563', marginTop: '16px', marginBottom: '8px' }}>推奨される使い方</h4>
        <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
          <p style={{ margin: '0 0 8px 0', color: '#374151' }}>β版では、以下のような一般的な内容のみを記載してください：</p>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
            <li>「買い物に行く」「掃除をする」といった日常的なタスク</li>
            <li>「資料作成」「会議準備」などの概要的な業務タスク</li>
            <li>「運動する」「本を読む」といった習慣タスク</li>
            <li>個人を特定できない一般的なメモ</li>
          </ul>
        </div>

        <h3 style={{ fontSize: '18px', color: '#374151', marginTop: '24px', marginBottom: '12px' }}>10-3. 正式版移行時の注意点</h3>
        <p style={{ color: '#6b7280', marginBottom: '12px' }}>
          正式版への移行時には、いくつかの重要な変更が行われます。
        </p>
        <ul style={{ color: '#6b7280', marginBottom: '16px' }}>
          <li>β版で作成したタスクも含め、すべてのデータが暗号化されます</li>
          <li>正式版への移行前に、個人情報を含むタスクを作成してしまっている場合は、事前に削除することをお勧めします</li>
          <li>ログインしたGoogleアカウントがわからなくなると、タスクを見ることができなくなり、データの復旧もできません</li>
          <li>Googleアカウントの管理を厳重に行っていただくとともに、アカウントの2段階認証を有効にしておくことを強く推奨します</li>
        </ul>

        <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <p style={{ margin: 0, color: '#374151' }}>
            暗号化の実装により、管理者であってもタスク内容を確認できなくなるため、より安心して個人的な情報を記載できるようになります。
          </p>
        </div>
      </section>

      {/* 11. よくある質問 */}
      <section id="faq" style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
          11. よくある質問
        </h2>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', color: '#374151', marginBottom: '8px' }}>Q. 繰り返しタスクが表示されない</h3>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: 0, color: '#6b7280' }}>
              A. ブラウザを更新してください。それでも表示されない場合は、テンプレート管理（⚙️）で該当タスクが有効か確認してください。
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
              A. 「やることリストへ」ボタンで期日なしタスクに変更できます。期日のプレッシャーから解放されます。
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', color: '#374151', marginBottom: '8px' }}>Q. 買い物リストがメモに表示される</h3>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: 0, color: '#6b7280' }}>
              A. 古いデータの可能性があります。新しく作成したタスクは、買い物リストがメモに含まれません。
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