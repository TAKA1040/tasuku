'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface RecurringTemplate {
  id: string
  title: string
  memo?: string
  category?: string
  importance?: number
  urls?: string[]
  start_time?: string
  end_time?: string
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
  urls?: string[]
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
  const [newUrl, setNewUrl] = useState('')

  const supabase = createClient()

  // URL管理ヘルパー関数
  const handleAddUrl = () => {
    if (newUrl.trim() && editingTemplate) {
      try {
        new URL(newUrl.trim())
        const currentUrls = editingTemplate.urls || []
        if (currentUrls.length >= 5) {
          alert('URLは最大5個まで追加できます')
          return
        }
        setEditingTemplate({
          ...editingTemplate,
          urls: [...currentUrls, newUrl.trim()]
        })
        setNewUrl('')
      } catch {
        alert('有効なURLを入力してください')
      }
    }
  }

  const handleRemoveUrl = (index: number) => {
    if (editingTemplate) {
      const newUrls = editingTemplate.urls?.filter((_, i) => i !== index) || []
      setEditingTemplate({
        ...editingTemplate,
        urls: newUrls.length > 0 ? newUrls : undefined
      })
    }
  }

  const handleOpenAllUrls = () => {
    if (!editingTemplate?.urls || editingTemplate.urls.length === 0) return

    const confirmMessage = `${editingTemplate.urls.length}個のURLを開きますか？`
    if (confirm(confirmMessage)) {
      editingTemplate.urls.forEach(url => {
        window.open(url, '_blank', 'noopener,noreferrer')
      })
    }
  }

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

  const loadData = useCallback(async () => {
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

      console.log('📋 テンプレート読み込み結果:', templatesData?.map(t => ({
        id: t.id,
        title: t.title,
        urls: t.urls,
        urlsType: typeof t.urls,
        urlsLength: t.urls?.length,
        hasUrls: t.urls && t.urls.length > 0,
        rawData: t
      })))

      console.log('📋 生データ全体:', templatesData)

      // URLsフィールドを正規化（文字列を配列に変換）
      const normalizedTemplates = templatesData?.map(template => {
        let normalizedUrls = []

        if (template.urls) {
          if (Array.isArray(template.urls)) {
            normalizedUrls = template.urls
          } else if (typeof template.urls === 'string') {
            // 文字列の場合、JSONとしてパースを試行
            try {
              const parsed = JSON.parse(template.urls)
              normalizedUrls = Array.isArray(parsed) ? parsed : [template.urls]
            } catch {
              // JSONパースに失敗した場合、単一の文字列として扱う
              normalizedUrls = template.urls.trim() ? [template.urls] : []
            }
          }
        }

        return {
          ...template,
          urls: normalizedUrls
        }
      }) || []

      console.log('📋 正規化後:', normalizedTemplates.map(t => ({
        id: t.id,
        title: t.title,
        urls: t.urls,
        urlsType: typeof t.urls,
        isArray: Array.isArray(t.urls)
      })))

      setTemplates(normalizedTemplates)

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
  }, [supabase])

  const createTemplateFromTask = useCallback(async (task: UnifiedTask) => {
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
  }, [supabase, loadData])

  const updateTemplate = async (template: RecurringTemplate) => {
    try {
      setStatus(`${template.title}を更新中...`)

      // URLsを正規化（配列として確実に保存）
      const normalizedUrls = Array.isArray(template.urls)
        ? template.urls.filter(url => url && url.trim())  // 空文字列を除去
        : []

      console.log('🔄 テンプレート更新:', {
        title: template.title,
        originalUrls: template.urls,
        normalizedUrls: normalizedUrls,
        urlsLength: normalizedUrls.length
      })

      const { error } = await supabase
        .from('recurring_templates')
        .update({
          title: template.title,
          memo: template.memo,
          category: template.category,
          importance: template.importance,
          start_time: template.start_time,
          end_time: template.end_time,
          pattern: template.pattern,
          weekdays: template.weekdays,
          day_of_month: template.day_of_month,
          month_of_year: template.month_of_year,
          day_of_year: template.day_of_year,
          active: template.active,
          urls: normalizedUrls,  // 正規化されたURLsを保存
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id)

      if (error) {
        console.error('❌ テンプレート更新エラー:', error)
        setStatus(`更新エラー: ${error.message}`)
        return
      }

      console.log('✅ テンプレート更新成功')

      // 関連タスクのURLsも更新
      const { data: relatedTasks, error: tasksError } = await supabase
        .from('unified_tasks')
        .select('id, title')
        .eq('recurring_template_id', template.id)
        .eq('completed', false) // 未完了タスクのみ

      if (tasksError) {
        console.warn('関連タスク取得エラー:', tasksError)
      } else if (relatedTasks && relatedTasks.length > 0) {
        console.log(`🔄 関連タスク ${relatedTasks.length}件のURLsを更新中...`)

        const { error: updateTasksError } = await supabase
          .from('unified_tasks')
          .update({
            urls: normalizedUrls,
            start_time: template.start_time,
            end_time: template.end_time
          })
          .eq('recurring_template_id', template.id)
          .eq('completed', false)

        if (updateTasksError) {
          console.error('関連タスク更新エラー:', updateTasksError)
          setStatus(`テンプレート更新成功、但し関連タスク更新失敗: ${updateTasksError.message}`)
        } else {
          console.log(`✅ 関連タスク ${relatedTasks.length}件のURLsを更新完了`)
          setStatus(`✅ ${template.title}と関連タスク${relatedTasks.length}件を更新しました`)
        }
      } else {
        setStatus(`✅ ${template.title}を更新しました`)
      }

      setEditingTemplate(null)
      setNewUrl('')
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
  }, [loadData])

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
                  color: '#374151',
                  width: '120px'
                }}>🌍 URLs (デバッグ)</th>
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
                    {/* デバッグ表示: URLの詳細な状態を表示 */}
                    <div style={{ fontSize: '9px', marginBottom: '2px', backgroundColor: '#f9f9f9', padding: '2px', borderRadius: '2px' }}>
                      {template.urls === undefined ? '❌ undefined' :
                       template.urls === null ? '⚪ null' :
                       Array.isArray(template.urls) ? `✅ [${template.urls.length}]` :
                       `⚠️ ${typeof template.urls}: "${String(template.urls).substring(0, 20)}..."`}
                    </div>
                    {template.urls && template.urls.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          const validUrls = template.urls?.filter(url => {
                            try {
                              new URL(url)
                              return true
                            } catch {
                              return false
                            }
                          }) || []
                          if (validUrls.length === 0) {
                            alert('有効なURLが見つかりませんでした。')
                            return
                          }
                          if (confirm(`${validUrls.length}個のURLを開きますか？`)) {
                            validUrls.forEach(url => window.open(url, '_blank', 'noopener,noreferrer'))
                          }
                        }}
                        style={{
                          border: 'none',
                          background: 'none',
                          fontSize: '16px',
                          cursor: 'pointer',
                          padding: '2px'
                        }}
                        title={`${template.urls.length}個のURLを一括で開く`}
                      >
                        🌍
                      </button>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '11px' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        setEditingTemplate(template)
                        setNewUrl('')
                      }}
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
            padding: '12px',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '95vh',
            overflow: 'auto'
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '10px',
              color: '#1f2937',
              textAlign: 'center'
            }}>
              テンプレート編集
            </h2>

            {/* タイトル */}
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                minWidth: '70px'
              }}>
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
                  flex: 1,
                  padding: '6px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              />
            </div>

            {/* メモ */}
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                minWidth: '70px',
                paddingTop: '6px'
              }}>
                メモ
              </label>
              <textarea
                value={editingTemplate.memo || ''}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  memo: e.target.value
                })}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '13px',
                  minHeight: '32px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* カテゴリ */}
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                minWidth: '70px'
              }}>
                カテゴリ
              </label>
              <select
                value={editingTemplate.category || ''}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  category: e.target.value
                })}
                style={{
                  flex: 1,
                  padding: '6px 8px',
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

            {/* 重要度 */}
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                minWidth: '70px'
              }}>
                重要度
              </label>
              <select
                value={editingTemplate.importance || 3}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  importance: parseInt(e.target.value)
                })}
                style={{
                  flex: 1,
                  padding: '6px 8px',
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

            {/* 開始時刻 */}
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                minWidth: '70px'
              }}>
                開始時刻
              </label>
              <input
                type="time"
                value={editingTemplate.start_time || ''}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  start_time: e.target.value || undefined
                })}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* 終了時刻 */}
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                minWidth: '70px'
              }}>
                終了時刻
              </label>
              <input
                type="time"
                value={editingTemplate.end_time || ''}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  end_time: e.target.value || undefined
                })}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                関連URL（最大5個）
                {editingTemplate.urls && editingTemplate.urls.length > 3 && (
                  <span style={{ color: '#f59e0b', fontSize: '10px', marginLeft: '6px' }}>
                    推奨数（3個）を超えています
                  </span>
                )}
              </label>

              {/* URL入力エリア */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com"
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  disabled={!newUrl.trim() || (editingTemplate.urls?.length || 0) >= 5}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    opacity: (!newUrl.trim() || (editingTemplate.urls?.length || 0) >= 5) ? 0.5 : 1
                  }}
                >
                  追加
                </button>
              </div>

              {/* URL一覧 */}
              {editingTemplate.urls && editingTemplate.urls.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#6b7280' }}>
                      {editingTemplate.urls.length}個のURL
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenAllUrls}
                      style={{
                        padding: '2px 6px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '9px',
                        cursor: 'pointer'
                      }}
                    >
                      🌍 全て開く
                    </button>
                  </div>
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    maxHeight: '120px',
                    overflowY: 'auto'
                  }}>
                    {editingTemplate.urls.map((url, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px 6px',
                          borderBottom: index < editingTemplate.urls!.length - 1 ? '1px solid #f3f4f6' : 'none'
                        }}
                      >
                        <span
                          style={{
                            flex: 1,
                            fontSize: '11px',
                            color: '#374151',
                            wordBreak: 'break-all',
                            lineHeight: '1.3'
                          }}
                        >
                          {url}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveUrl(index)}
                          style={{
                            padding: '2px 4px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '2px',
                            fontSize: '9px',
                            cursor: 'pointer',
                            marginLeft: '4px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                URLを入力すると、タスク一覧で🌍アイコンから一括で開けます
              </div>
            </div>

            {/* 繰り返しパターン */}
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                minWidth: '70px'
              }}>
                繰り返し
              </label>
              <select
                value={editingTemplate.pattern}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  pattern: e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
                })}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="DAILY">毎日</option>
                <option value="WEEKLY">毎週</option>
                <option value="MONTHLY">毎月</option>
                <option value="YEARLY">毎年</option>
              </select>
            </div>

            {editingTemplate.pattern === 'WEEKLY' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  曜日選択
                </label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {['月', '火', '水', '木', '金', '土', '日'].map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const dayValue = index + 1
                        const newWeekdays = editingTemplate.weekdays?.includes(dayValue)
                          ? editingTemplate.weekdays.filter(w => w !== dayValue)
                          : [...(editingTemplate.weekdays || []), dayValue]
                        setEditingTemplate({
                          ...editingTemplate,
                          weekdays: newWeekdays
                        })
                      }}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        background: editingTemplate.weekdays?.includes(index + 1) ? '#3b82f6' : 'white',
                        color: editingTemplate.weekdays?.includes(index + 1) ? 'white' : '#374151',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editingTemplate.pattern === 'MONTHLY' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  日付
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={editingTemplate.day_of_month || 1}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    day_of_month: parseInt(e.target.value) || 1
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
            )}

            {editingTemplate.pattern === 'YEARLY' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    月
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={editingTemplate.month_of_year || 1}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      month_of_year: parseInt(e.target.value) || 1
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
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    日
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={editingTemplate.day_of_year || 1}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      day_of_year: parseInt(e.target.value) || 1
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
              </div>
            )}

            {/* アクティブ */}
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                minWidth: '70px',
                paddingTop: '2px'
              }}>
                アクティブ
              </label>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingTemplate.active}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      active: e.target.checked
                    })}
                    style={{ marginRight: '6px' }}
                  />
                  <span style={{ fontSize: '13px', color: '#374151' }}>
                    ONにすると毎日自動的にタスクが生成されます
                  </span>
                </label>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', marginLeft: '22px' }}>
                  OFFの場合は新しいタスクが作成されません
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setEditingTemplate(null)
                  setNewUrl('')
                }}
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
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a
            href="/today"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: '#2563eb',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📅 今日のタスク
          </a>
          <a
            href="/search"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: '#6b7280',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🔍 検索
          </a>
          <a
            href="/statistics"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: '#6b7280',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📊 統計
          </a>
        </div>
      </div>
    </div>
  )
}