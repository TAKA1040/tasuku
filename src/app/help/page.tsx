'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function HelpPage() {
  useEffect(() => {
    document.title = 'TASUKU - 使い方'
  }, [])

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
      backgroundColor: '#ffffff',
      minHeight: '100vh'
    }}>
      {/* ヘッダー */}
      <header style={{
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📋 TASUKU 使い方ガイド
          </h1>
          <Link href="/" style={{
            color: '#3b82f6',
            textDecoration: 'none',
            fontSize: '14px',
            padding: '8px 16px',
            border: '1px solid #3b82f6',
            borderRadius: '6px'
          }}>
            ← ホームに戻る
          </Link>
        </div>
      </header>

      {/* 目次 */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', color: '#374151', marginBottom: '16px' }}>📖 目次</h2>
        <ul style={{ lineHeight: 1.8, color: '#6b7280' }}>
          <li><a href="#basic-usage" style={{ color: '#3b82f6', textDecoration: 'none' }}>基本的な使い方</a></li>
          <li><a href="#today-tasks" style={{ color: '#3b82f6', textDecoration: 'none' }}>今日のタスク</a></li>
          <li><a href="#overdue-tasks" style={{ color: '#3b82f6', textDecoration: 'none' }}>期日切れタスク</a></li>
          <li><a href="#shopping-tasks" style={{ color: '#3b82f6', textDecoration: 'none' }}>買い物機能</a></li>
          <li><a href="#recurring-tasks" style={{ color: '#3b82f6', textDecoration: 'none' }}>毎日タスク</a></li>
          <li><a href="#idea-list" style={{ color: '#3b82f6', textDecoration: 'none' }}>やることリスト</a></li>
          <li><a href="#upcoming-tasks" style={{ color: '#3b82f6', textDecoration: 'none' }}>近々の予定</a></li>
          <li><a href="#rollover" style={{ color: '#3b82f6', textDecoration: 'none' }}>繰り越し機能</a></li>
        </ul>
      </section>

      {/* 基本的な使い方 */}
      <section id="basic-usage" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '22px', color: '#374151', marginBottom: '16px' }}>🚀 基本的な使い方</h2>
        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
          <p style={{ margin: '0 0 12px 0', color: '#374151' }}>
            TASUKUは、シンプルで効率的なタスク管理ツールです。日々のタスクから長期的な目標まで、あなたの生産性をサポートします。
          </p>
        </div>

        <h3 style={{ fontSize: '18px', color: '#4b5563', marginBottom: '12px' }}>📝 タスクの作成</h3>
        <ul style={{ lineHeight: 1.8, color: '#6b7280', marginBottom: '16px' }}>
          <li><strong>「+ 追加」ボタン</strong>をクリックしてタスクを作成</li>
          <li><strong>タイトル</strong>：必須項目</li>
          <li><strong>期日</strong>：設定すると今日のタスクや期日切れに表示</li>
          <li><strong>カテゴリー</strong>：仕事、プライベート、買い物など</li>
          <li><strong>重要度</strong>：1〜5で設定（色付きドットで表示）</li>
          <li><strong>所要時間</strong>：見積もり時間を設定</li>
          <li><strong>URL</strong>：関連リンクを複数設定可能</li>
          <li><strong>ファイル添付</strong>：画像やPDFを添付可能</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: '#4b5563', marginBottom: '12px' }}>✅ タスクの完了</h3>
        <ul style={{ lineHeight: 1.8, color: '#6b7280' }}>
          <li><strong>チェックボックス</strong>をクリックして完了</li>
          <li>完了したタスクは自動的に完了済みセクションに移動</li>
          <li><strong>✏️ボタン</strong>でいつでも編集可能</li>
          <li><strong>🗑️ボタン</strong>で削除（確認ダイアログ表示）</li>
        </ul>
      </section>

      {/* 今日のタスク */}
      <section id="today-tasks" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '22px', color: '#374151', marginBottom: '16px' }}>📅 今日のタスク</h2>
        <ul style={{ lineHeight: 1.8, color: '#6b7280' }}>
          <li><strong>今日が期日</strong>のタスクが自動的に表示</li>
          <li><strong>毎日タスク</strong>も同じ場所に表示</li>
          <li><strong>テーブル形式</strong>で見やすく整理</li>
          <li><strong>写真アイコン（📷）</strong>：添付ファイル表示・プレビュー</li>
          <li><strong>地球アイコン（🌍）</strong>：関連URLを一括オープン</li>
          <li><strong>重要度ドット</strong>：色で優先度を視覚化</li>
        </ul>
      </section>

      {/* 期日切れタスク */}
      <section id="overdue-tasks" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '22px', color: '#374151', marginBottom: '16px' }}>⚠️ 期日切れタスク</h2>
        <ul style={{ lineHeight: 1.8, color: '#6b7280', marginBottom: '16px' }}>
          <li><strong>期日を過ぎた未完了タスク</strong>が表示</li>
          <li><strong>件数表示</strong>で一目で確認</li>
          <li><strong>「表示」チェックボックス</strong>で詳細の表示/非表示を切り替え</li>
          <li><strong>薄い赤背景</strong>で期日切れであることを強調</li>
        </ul>

        <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>🎯 特別機能：やることリストへ移動</h4>
          <p style={{ margin: 0, color: '#374151' }}>
            <strong>「やることリストへ」ボタン</strong>をクリックすると、期日を削除してやることリストに移動します。
            期日のプレッシャーから解放され、ゆるやかな管理に変更できます。
          </p>
        </div>
      </section>

      {/* 買い物機能 */}
      <section id="shopping-tasks" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '22px', color: '#374151', marginBottom: '16px' }}>🛒 買い物機能</h2>

        <h3 style={{ fontSize: '18px', color: '#4b5563', marginBottom: '12px' }}>📍 表示場所</h3>
        <ul style={{ lineHeight: 1.8, color: '#6b7280', marginBottom: '16px' }}>
          <li><strong>今日の買い物</strong>：今日のタスクテーブルに統合表示</li>
          <li><strong>翌日以降の買い物</strong>：専用の「🛒 買い物」セクションに表示</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: '#4b5563', marginBottom: '12px' }}>📝 買い物リスト</h3>
        <ul style={{ lineHeight: 1.8, color: '#6b7280', marginBottom: '16px' }}>
          <li><strong>「買うものリスト表示」チェックボックス</strong>で展開</li>
          <li><strong>買うものを追加</strong>：リアルタイムで追加・削除・編集</li>
          <li><strong>チェック機能</strong>：購入済みアイテムにチェック</li>
          <li><strong>テキストクリック編集</strong>：アイテム名をクリックして編集</li>
        </ul>

        <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#059669' }}>🎯 特別機能：自動繰り越し</h4>
          <p style={{ margin: 0, color: '#374151' }}>
            買い物タスクを完了しても、<strong>未チェックの買い物アイテムがある場合は自動的に新しいタスクを作成</strong>します。
            チェック済みアイテムは完了タスクに残り、未完了分のみが期日なしタスクとして繰り越されます。
          </p>
        </div>
      </section>

      {/* 毎日タスク */}
      <section id="recurring-tasks" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '22px', color: '#374151', marginBottom: '16px' }}>🔄 毎日タスク</h2>
        <ul style={{ lineHeight: 1.8, color: '#6b7280', marginBottom: '16px' }}>
          <li><strong>繰り返し設定</strong>：毎日、毎週、毎月、毎年</li>
          <li><strong>曜日指定</strong>：毎週のタスクは特定曜日を指定可能</li>
          <li><strong>自動表示</strong>：該当日に自動的に今日のタスクに表示</li>
          <li><strong>完了管理</strong>：日ごとに個別に完了管理</li>
        </ul>

        <div style={{ backgroundColor: '#fefce8', padding: '16px', borderRadius: '8px', border: '1px solid #fde047' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#ca8a04' }}>⏰ 前日分の表示ルール</h4>
          <p style={{ margin: 0, color: '#374151' }}>
            毎日タスクは<strong>前日分の未完了も表示</strong>されます（「前日分」と表示）。
            ただし、前々日以前の毎日タスクは表示されません（管理が煩雑になるのを防ぐため）。
          </p>
        </div>
      </section>

      {/* やることリスト */}
      <section id="idea-list" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '22px', color: '#374151', marginBottom: '16px' }}>💡 やることリスト</h2>
        <ul style={{ lineHeight: 1.8, color: '#6b7280', marginBottom: '16px' }}>
          <li><strong>期限なし</strong>のアイデア・やりたいことを自由に記録</li>
          <li><strong>「表示する」チェックボックス</strong>で表示/非表示を切り替え</li>
          <li><strong>完了管理</strong>：左のチェックボックスで完了・未完了切り替え</li>
          <li><strong>完了したアイデア</strong>：折りたたみ表示で整理</li>
        </ul>

        <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '8px', border: '1px solid #7dd3fc' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#0369a1' }}>🚀 特別機能：タスクへの昇格</h4>
          <p style={{ margin: '0 0 8px 0', color: '#374151' }}>
            <strong>📋 ボタン</strong>をクリックすると、アイデアを本格的なタスクに昇格できます：
          </p>
          <ul style={{ margin: 0, paddingLeft: '16px', color: '#374151' }}>
            <li>タスク編集フォームが開き、タイトルが事前入力済み</li>
            <li>期日、カテゴリ、重要度、所要時間、URLなど詳細を追加</li>
            <li>元のアイデアは自動削除され、正式タスクとして管理開始</li>
          </ul>
        </div>
      </section>

      {/* 近々の予定 */}
      <section id="upcoming-tasks" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '22px', color: '#374151', marginBottom: '16px' }}>📊 近々の予定</h2>
        <ul style={{ lineHeight: 1.8, color: '#6b7280' }}>
          <li><strong>今後のタスク</strong>を期日順に表示</li>
          <li><strong>緊急度</strong>に応じて色分け（赤・黄・緑・グレー）</li>
          <li><strong>統計情報</strong>：総タスク数、今日のタスク数、完了率</li>
          <li><strong>毎日タスク</strong>も将来の予定として表示</li>
        </ul>
      </section>

      {/* 繰り越し機能 */}
      <section id="rollover" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '22px', color: '#374151', marginBottom: '16px' }}>🔄 繰り越し機能</h2>
        <ul style={{ lineHeight: 1.8, color: '#6b7280', marginBottom: '16px' }}>
          <li><strong>未完了タスク</strong>を自動で翌日に繰り越し</li>
          <li><strong>繰り越し候補</strong>が表示されたら内容を確認</li>
          <li><strong>「実行」ボタン</strong>で一括繰り越し</li>
          <li><strong>個別選択</strong>も可能（不要なものは除外）</li>
        </ul>
      </section>

      {/* 便利な機能 */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '22px', color: '#374151', marginBottom: '16px' }}>✨ その他の便利な機能</h2>

        <h3 style={{ fontSize: '18px', color: '#4b5563', marginBottom: '12px' }}>🖼️ ファイル添付</h3>
        <ul style={{ lineHeight: 1.8, color: '#6b7280', marginBottom: '16px' }}>
          <li><strong>画像・PDF</strong>などのファイルを添付可能</li>
          <li><strong>📷 アイコン</strong>をクリックでプレビュー表示</li>
          <li><strong>ポップアップ</strong>で大きく表示、ダウンロードも可能</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: '#4b5563', marginBottom: '12px' }}>🌍 URL管理</h3>
        <ul style={{ lineHeight: 1.8, color: '#6b7280', marginBottom: '16px' }}>
          <li><strong>複数URL</strong>を1つのタスクに設定可能</li>
          <li><strong>🌍 アイコン</strong>をクリックで全URLを一括オープン</li>
          <li><strong>無効URL</strong>は自動検証・警告表示</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: '#4b5563', marginBottom: '12px' }}>📱 レスポンシブ対応</h3>
        <ul style={{ lineHeight: 1.8, color: '#6b7280' }}>
          <li><strong>PC・タブレット・スマホ</strong>に対応</li>
          <li><strong>画面サイズ</strong>に応じて最適な表示</li>
          <li><strong>タッチ操作</strong>も快適</li>
        </ul>
      </section>

      {/* サポート */}
      <section style={{ marginBottom: '32px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '22px', color: '#374151', marginBottom: '16px' }}>🎯 使い方のコツ</h2>
        <ul style={{ lineHeight: 1.8, color: '#6b7280' }}>
          <li><strong>毎朝</strong>：今日のタスクを確認し、優先順位を整理</li>
          <li><strong>随時</strong>：やることリストに思いついたアイデアを記録</li>
          <li><strong>買い物前</strong>：買い物タスクのリストをチェック</li>
          <li><strong>夕方</strong>：完了したタスクをチェック、明日の準備</li>
          <li><strong>週次</strong>：期日切れタスクを整理し、必要に応じてやることリストへ移動</li>
        </ul>
      </section>

      {/* フッター */}
      <footer style={{
        textAlign: 'center',
        padding: '24px 0',
        borderTop: '1px solid #e5e7eb',
        color: '#6b7280'
      }}>
        <p style={{ margin: 0 }}>
          TASUKU で効率的なタスク管理を始めましょう！
          <Link href="/" style={{ color: '#3b82f6', textDecoration: 'none', marginLeft: '8px' }}>
            → アプリに戻る
          </Link>
        </p>
      </footer>
    </div>
  )
}