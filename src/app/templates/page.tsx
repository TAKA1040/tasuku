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

// 重要度に応じた色を返すヘルパー関数
const getImportanceColor = (importance?: number | null): string => {
  switch (importance) {
    case 5: return '#dc2626' // 赤 - 最高重要度
    case 4: return '#ea580c' // オレンジ - 高重要度
    case 3: return '#ca8a04' // 黄 - 中重要度
    case 2: return '#16a34a' // 緑 - 低重要度
    case 1: return '#2563eb' // 青 - 最低重要度
    default: return '#9ca3af' // グレー - 重要度なし
  }
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
        <div style={{ marginBottom: '30px', overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{
                  padding: '8px',
                  textAlign: 'left',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: '600',
                  color: '#374151'
                }}>状態</th>
                <th style={{
                  padding: '8px',
                  textAlign: 'left',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: '600',
                  color: '#374151'
                }}>パターン</th>
                <th style={{
                  padding: '8px',
                  textAlign: 'left',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: '600',
                  color: '#374151'
                }}>タイトル</th>
                <th style={{
                  padding: '8px',
                  textAlign: 'left',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: '600',
                  color: '#374151'
                }}>カテゴリ</th>
                <th style={{
                  padding: '8px',
                  textAlign: 'center',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: '600',
                  color: '#374151'
                }}>重要度</th>
                <th style={{
                  padding: '8px',
                  textAlign: 'center',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: '600',
                  color: '#374151'
                }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(template => (
                <tr key={template.id} style={{
                  backgroundColor: template.active ? 'white' : '#fef2f2',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <td style={{ padding: '8px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500',
                      backgroundColor: template.active ? '#dcfce7' : '#fee2e2',
                      color: template.active ? '#166534' : '#991b1b'
                    }}>
                      {template.active ? 'アクティブ' : '停止中'}
                    </span>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                      backgroundColor: '#eff6ff',
                      color: '#1e40af'
                    }}>
                      {template.pattern}
                    </span>
                  </td>
                  <td style={{ padding: '8px', fontWeight: '500' }}>
                    {template.title}
                    {template.memo && (
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                        {template.memo}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {template.category ? (
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151'
                      }}>
                        📁 {template.category}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '11px' }}>なし</span>
                    )}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: getImportanceColor(template.importance)
                    }}></span>
                    <span style={{ marginLeft: '4px', fontSize: '11px' }}>
                      {template.importance}/5
                    </span>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <button
                      onClick={() => deleteTemplate(template)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>未関連付けの繰り返しタスク ({orphanTasks.length}件)</h2>
      <p>これらのタスクにはテンプレートが関連付けられていないため、TaskGeneratorが動作しません。</p>
      {orphanTasks.length === 0 ? (
        <div style={{
          padding: '20px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '24px', marginRight: '8px' }}>✅</span>
          すべてのタスクがテンプレートに関連付けられています
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            backgroundColor: 'white',
            border: '1px solid #fbbf24'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#fef3c7' }}>
                <th style={{
                  padding: '8px',
                  textAlign: 'left',
                  borderBottom: '1px solid #fbbf24',
                  fontWeight: '600',
                  color: '#92400e'
                }}>パターン</th>
                <th style={{
                  padding: '8px',
                  textAlign: 'left',
                  borderBottom: '1px solid #fbbf24',
                  fontWeight: '600',
                  color: '#92400e'
                }}>タイトル</th>
                <th style={{
                  padding: '8px',
                  textAlign: 'left',
                  borderBottom: '1px solid #fbbf24',
                  fontWeight: '600',
                  color: '#92400e'
                }}>カテゴリ</th>
                <th style={{
                  padding: '8px',
                  textAlign: 'center',
                  borderBottom: '1px solid #fbbf24',
                  fontWeight: '600',
                  color: '#92400e'
                }}>重要度</th>
                <th style={{
                  padding: '8px',
                  textAlign: 'center',
                  borderBottom: '1px solid #fbbf24',
                  fontWeight: '600',
                  color: '#92400e'
                }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {orphanTasks.map(task => (
                <tr key={task.id} style={{
                  backgroundColor: '#fffbeb',
                  borderBottom: '1px solid #fde68a'
                }}>
                  <td style={{ padding: '8px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af'
                    }}>
                      {task.recurring_pattern}
                    </span>
                  </td>
                  <td style={{ padding: '8px', fontWeight: '500' }}>
                    {task.title}
                    {task.memo && (
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                        {task.memo}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {task.category ? (
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151'
                      }}>
                        📁 {task.category}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '11px' }}>なし</span>
                    )}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: getImportanceColor(task.importance)
                    }}></span>
                    <span style={{ marginLeft: '4px', fontSize: '11px' }}>
                      {task.importance || 1}/5
                    </span>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <button
                      onClick={() => createTemplateFromTask(task)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      ✨ 作成
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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