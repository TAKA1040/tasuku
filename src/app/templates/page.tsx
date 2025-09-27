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
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null)

  const supabase = createClient()

  // パターンの詳細表示
  const formatPatternDetails = (template: RecurringTemplate): string => {
    switch (template.pattern) {
      case 'DAILY':
        return '毎日'
      case 'WEEKLY':
        if (template.weekdays && template.weekdays.length > 0) {
          const dayNames = ['月', '火', '水', '木', '金', '土', '日']
          const selectedDays = template.weekdays.map(d => dayNames[d - 1]).join('、')
          return `毎週 ${selectedDays}曜日`
        }
        return '毎週'
      case 'MONTHLY':
        if (template.day_of_month) {
          return `毎月 ${template.day_of_month}日`
        }
        return '毎月'
      case 'YEARLY':
        if (template.month_of_year && template.day_of_year) {
          return `毎年 ${template.month_of_year}月${template.day_of_year}日`
        }
        return '毎年'
      default:
        return template.pattern
    }
  }

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

  const updateTemplate = async (template: RecurringTemplate) => {
    try {
      setStatus(`${template.title}を更新中...`)

      const { error } = await supabase
        .from('recurring_templates')
        .update({
          title: template.title,
          memo: template.memo,
          category: template.category,
          importance: template.importance,
          active: template.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id)

      if (error) {
        setStatus(`更新エラー: ${error.message}`)
        return
      }

      setStatus(`✅ ${template.title}を更新しました`)
      setEditingTemplate(null)
      loadData()

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
                      {formatPatternDetails(template)}
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
                      onClick={() => setEditingTemplate(template)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        marginRight: '4px'
                      }}
                    >
                      ✏️
                    </button>
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

      {/* 編集モーダル */}
      {editingTemplate && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3>テンプレート編集</h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                タイトル
              </label>
              <input
                type="text"
                value={editingTemplate.title}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  title: e.target.value
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                メモ
              </label>
              <textarea
                value={editingTemplate.memo || ''}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  memo: e.target.value
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  minHeight: '60px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                カテゴリ
              </label>
              <select
                value={editingTemplate.category || ''}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  category: e.target.value
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">カテゴリなし</option>
                <option value="仕事">仕事</option>
                <option value="プライベート">プライベート</option>
                <option value="勉強">勉強</option>
                <option value="健康">健康</option>
                <option value="家事">家事</option>
                <option value="買い物">買い物</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                重要度
              </label>
              <select
                value={editingTemplate.importance || 3}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  importance: parseInt(e.target.value)
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value={1}>🔵 最低</option>
                <option value={2}>🟡 低</option>
                <option value={3}>🟡 普通</option>
                <option value={4}>🟠 高</option>
                <option value={5}>🔴 最高</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', fontWeight: '500' }}>
                <input
                  type="checkbox"
                  checked={editingTemplate.active}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    active: e.target.checked
                  })}
                  style={{ marginRight: '8px' }}
                />
                アクティブ
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingTemplate(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={() => updateTemplate(editingTemplate)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                更新
              </button>
            </div>
          </div>
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