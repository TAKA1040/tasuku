'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface RecurringTemplate {
  id: string
  title: string
  memo?: string
  category?: string
  importance?: number
  pattern: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  weekdays?: number[]
  day_of_month?: number
  month_of_year?: number
  day_of_year?: number
  active: boolean
  user_id: string
  created_at: string
  updated_at: string
}

interface UnifiedTask {
  id: string
  title: string
  memo?: string
  category?: string
  importance?: number
  recurring_pattern?: string
  recurring_template_id?: string
  task_type: string
  user_id: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([])
  const [orphanTasks, setOrphanTasks] = useState<UnifiedTask[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  const supabase = createClient()

  const loadData = async () => {
    try {
      setLoading(true)

      // 現在のユーザーを取得
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        setStatus('認証が必要です')
        return
      }

      // テンプレートを取得
      const { data: templatesData, error: templatesError } = await supabase
        .from('recurring_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (templatesError) {
        setStatus(`テンプレート取得エラー: ${templatesError.message}`)
        return
      }

      setTemplates(templatesData || [])

      // テンプレートIDがnullの繰り返しタスクを取得
      const { data: tasksData, error: tasksError } = await supabase
        .from('unified_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_type', 'RECURRING')
        .is('recurring_template_id', null)

      if (tasksError) {
        setStatus(`タスク取得エラー: ${tasksError.message}`)
        return
      }

      setOrphanTasks(tasksData || [])
      setStatus(`テンプレート: ${templatesData?.length || 0}件, 未関連付けタスク: ${tasksData?.length || 0}件`)

    } catch (error) {
      setStatus(`エラー: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const createTemplateFromTask = async (task: UnifiedTask) => {
    try {
      setStatus(`${task.title}のテンプレートを作成中...`)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        setStatus('認証が必要です')
        return
      }

      // テンプレートを作成
      const { data: templateData, error: templateError } = await supabase
        .from('recurring_templates')
        .insert({
          title: task.title,
          memo: task.memo,
          category: task.category,
          importance: task.importance || 1,
          pattern: task.recurring_pattern,
          user_id: user.id,
          active: true
        })
        .select()
        .single()

      if (templateError) {
        setStatus(`テンプレート作成エラー: ${templateError.message}`)
        return
      }

      // タスクにテンプレートIDを設定
      const { error: updateError } = await supabase
        .from('unified_tasks')
        .update({ recurring_template_id: templateData.id })
        .eq('id', task.id)

      if (updateError) {
        setStatus(`タスク更新エラー: ${updateError.message}`)
        return
      }

      setStatus(`✅ ${task.title}のテンプレートを作成しました`)
      loadData() // データを再読み込み

    } catch (error) {
      setStatus(`エラー: ${error}`)
    }
  }

  const deleteTemplate = async (template: RecurringTemplate) => {
    if (!confirm(`テンプレート「${template.title}」を削除しますか？`)) {
      return
    }

    try {
      setStatus(`${template.title}を削除中...`)

      const { error } = await supabase
        .from('recurring_templates')
        .delete()
        .eq('id', template.id)

      if (error) {
        setStatus(`削除エラー: ${error.message}`)
        return
      }

      setStatus(`✅ ${template.title}を削除しました`)
      loadData()

    } catch (error) {
      setStatus(`エラー: ${error}`)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) return <div>読み込み中...</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>繰り返しテンプレート管理</h1>

      {status && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          {status}
        </div>
      )}

      <button
        onClick={loadData}
        style={{
          padding: '10px 20px',
          marginBottom: '20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        データを再読み込み
      </button>

      <h2>登録済みテンプレート ({templates.length}件)</h2>
      {templates.length === 0 ? (
        <p>テンプレートが登録されていません</p>
      ) : (
        <div style={{ marginBottom: '30px' }}>
          {templates.map(template => (
            <div key={template.id} style={{
              padding: '15px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              marginBottom: '10px',
              backgroundColor: template.active ? '#f0fff0' : '#fff0f0'
            }}>
              <strong>{template.title}</strong> ({template.pattern})
              <br />
              カテゴリ: {template.category || 'なし'}
              <br />
              重要度: {template.importance}/5
              <br />
              状態: {template.active ? 'アクティブ' : '非アクティブ'}
              <br />
              <button
                onClick={() => deleteTemplate(template)}
                style={{
                  padding: '5px 10px',
                  marginTop: '10px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}

      <h2>未関連付けの繰り返しタスク ({orphanTasks.length}件)</h2>
      <p>これらのタスクにはテンプレートが関連付けられていないため、TaskGeneratorが動作しません。</p>
      {orphanTasks.length === 0 ? (
        <p>すべてのタスクがテンプレートに関連付けられています ✅</p>
      ) : (
        <div>
          {orphanTasks.map(task => (
            <div key={task.id} style={{
              padding: '15px',
              border: '1px solid #ffc107',
              borderRadius: '5px',
              marginBottom: '10px',
              backgroundColor: '#fff3cd'
            }}>
              <strong>{task.title}</strong> ({task.recurring_pattern})
              <br />
              カテゴリ: {task.category || 'なし'}
              <br />
              重要度: {task.importance || 1}/5
              <br />
              <button
                onClick={() => createTemplateFromTask(task)}
                style={{
                  padding: '5px 10px',
                  marginTop: '10px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                テンプレートを作成
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <h3>ナビゲーション</h3>
        <ul>
          <li><a href="/today">今日のページ</a></li>
          <li><a href="/search">検索ページ</a></li>
          <li><a href="/debug">デバッグページ</a></li>
        </ul>
      </div>
    </div>
  )
}