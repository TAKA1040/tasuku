'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTodayJST, formatDateJST } from '@/lib/utils/date-jst'

function RestoreContent() {
  const [status, setStatus] = useState('')
  const [isRestoring, setIsRestoring] = useState(false)

  const restoreYesterdayCompletions = async () => {
    setIsRestoring(true)
    setStatus('昨日の達成済みタスクを復旧中...')

    try {
      const supabase = createClient()

      // 今日と昨日の日付を取得
      const today = getTodayJST()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = formatDateJST(yesterday)

      setStatus(`復旧対象: ${yesterdayStr} → ${today}`)

      // 現在のユーザーIDを取得
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      // 今日のタスクを取得（これらが昨日も存在していたと仮定）
      const { data: todayTasks, error: todayError } = await supabase
        .from('unified_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('due_date', today)
        .eq('completed', false) // 現在未完了のタスク

      if (todayError) {
        throw new Error(`今日のタスク取得エラー: ${todayError.message}`)
      }

      setStatus(`対象タスク数: ${todayTasks?.length || 0}件`)

      // 各タスクについて昨日の完了履歴を作成
      let restoredCount = 0
      const results = []

      for (const task of todayTasks || []) {
        // 既に昨日の完了履歴があるかチェック（日付のみで）
        const { data: existingDone } = await supabase
          .from('done')
          .select('id')
          .eq('original_task_id', task.id)
          .like('completed_at', `${yesterdayStr}%`)
          .limit(1)

        if (existingDone && existingDone.length > 0) {
          results.push(`スキップ: ${task.title} (既に履歴あり)`)
          continue
        }

        // 昨日の完了履歴を作成
        const { error: insertError } = await supabase
          .from('done')
          .insert({
            original_task_id: task.id,
            original_title: task.title,
            original_memo: task.memo,
            original_category: task.category,
            original_importance: task.importance,
            original_due_date: yesterdayStr, // 昨日の日付として記録
            original_recurring_pattern: task.recurring_pattern,
            original_display_number: task.display_number,
            completed_at: `${yesterdayStr}T23:59:59.000Z`, // 昨日の終了時刻（UTC）
            user_id: user.id
          })

        if (insertError) {
          console.error(`履歴作成エラー (${task.title}):`, insertError)
          results.push(`エラー: ${task.title} - ${insertError.message}`)
        } else {
          restoredCount++
          results.push(`復旧完了: ${task.title} (${yesterdayStr})`)
          console.log(`復旧完了: ${task.title} (${yesterdayStr})`)
        }
      }

      setStatus(`復旧完了！ ${restoredCount}件の昨日の達成記録を復旧しました。\n\n詳細:\n${results.join('\n')}`)

    } catch (error) {
      console.error('復旧エラー:', error)
      setStatus(`エラー: ${error}`)
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>昨日の達成済みタスク復旧ツール</h1>

      <div style={{ marginBottom: '20px', backgroundColor: '#fff3cd', padding: '15px', borderRadius: '5px' }}>
        <h3>⚠️ 注意</h3>
        <p>このツールは、現在の今日のタスクが昨日も存在していて、すべて達成済みだったという前提で、昨日の達成履歴をdoneテーブルに復旧します。</p>
        <ul>
          <li>今日の未完了タスク → 昨日の完了履歴として記録</li>
          <li>重複チェック済み（既存の履歴は上書きしません）</li>
          <li>復旧後は/doneページで昨日の達成状況が確認できます</li>
        </ul>
      </div>

      <button
        onClick={restoreYesterdayCompletions}
        disabled={isRestoring}
        style={{
          padding: '15px 30px',
          fontSize: '16px',
          backgroundColor: isRestoring ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: isRestoring ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {isRestoring ? '復旧中...' : '昨日の達成履歴を復旧する'}
      </button>

      {status && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>ステータス:</strong> {status}
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <h3>確認リンク</h3>
        <ul>
          <li><a href="/debug" target="_blank">デバッグページ（DB状況確認）</a></li>
          <li><a href="/done" target="_blank">完了ページ（達成履歴確認）</a></li>
          <li><a href="/today" target="_blank">今日のページ</a></li>
        </ul>
      </div>
    </div>
  )
}

export default function RestorePage() {
  // Disable restore page in production
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Page Not Available</h1>
        <p>This restore page is only available in development mode.</p>
      </div>
    )
  }

  return <RestoreContent />
}