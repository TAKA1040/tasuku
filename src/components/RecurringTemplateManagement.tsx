'use client'

import { useState } from 'react'
import { useRecurringTemplates } from '@/hooks/useRecurringTemplates'
import type { RecurringTemplate, RecurringTemplateCreate } from '@/lib/types/recurring-template'
import { logger } from '@/lib/utils/logger'

export default function RecurringTemplateManagement() {
  const {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplate
  } = useRecurringTemplates()

  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null)
  const [formData, setFormData] = useState<RecurringTemplateCreate>({
    title: '',
    memo: '',
    category: '',
    importance: 3,
    pattern: 'DAILY',
    weekdays: [],
    day_of_month: 1,
    month_of_year: 1,
    day_of_year: 1,
    active: true
  })

  const handleEdit = (template: RecurringTemplate) => {
    setEditingTemplate(template)
    setFormData({
      title: template.title,
      memo: template.memo || '',
      category: template.category || '',
      importance: template.importance,
      pattern: template.pattern,
      weekdays: template.weekdays || [],
      day_of_month: template.day_of_month || 1,
      month_of_year: template.month_of_year || 1,
      day_of_year: template.day_of_year || 1,
      active: template.active
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) return

    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, formData)
      } else {
        await createTemplate(formData)
      }
      handleCancel()
    } catch (error) {
      logger.error('Template save error:', error)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (confirm('このテンプレートを削除しますか？')) {
      try {
        await deleteTemplate(templateId)
      } catch (error) {
        logger.error('Template delete error:', error)
      }
    }
  }

  const handleToggle = async (templateId: string) => {
    try {
      await toggleTemplate(templateId)
    } catch (error) {
      logger.error('Template toggle error:', error)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingTemplate(null)
    setFormData({
      title: '',
      memo: '',
      category: '',
      importance: 3,
      pattern: 'DAILY',
      weekdays: [],
      day_of_month: 1,
      month_of_year: 1,
      day_of_year: 1,
      active: true
    })
  }

  const handleCreateNew = () => {
    setEditingTemplate(null)
    setFormData({
      title: '',
      memo: '',
      category: '',
      importance: 3,
      pattern: 'DAILY',
      weekdays: [],
      day_of_month: 1,
      month_of_year: 1,
      day_of_year: 1,
      active: true
    })
    setShowForm(true)
  }

  const getPatternDisplayName = (template: RecurringTemplate): string => {
    switch (template.pattern) {
      case 'DAILY':
        return '毎日'
      case 'WEEKLY':
        if (template.weekdays && template.weekdays.length > 0) {
          const dayNames = ['月', '火', '水', '木', '金', '土', '日']
          const selectedDays = template.weekdays.map(d => dayNames[d - 1]).join('、')
          return `毎週 (${selectedDays})`
        }
        return '毎週'
      case 'MONTHLY':
        return `毎月 ${template.day_of_month}日`
      case 'YEARLY':
        return `毎年 ${template.month_of_year}月${template.day_of_year}日`
      default:
        return template.pattern
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        読み込み中...
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '500', margin: 0 }}>
          テンプレート管理 ({templates.length}件)
        </h2>
        <button
          onClick={handleCreateNew}
          style={{
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          + 新しいテンプレート
        </button>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          エラー: {error}
        </div>
      )}

      {templates.length === 0 ? (
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '40px',
          backgroundColor: '#fff',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          テンプレートがありません
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {templates.map((template) => (
            <div
              key={template.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: template.active ? '#fff' : '#f9fafb',
                opacity: template.active ? 1 : 0.7
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      margin: 0,
                      color: template.active ? '#000' : '#6b7280'
                    }}>
                      {template.title}
                    </h3>
                    {!template.active && (
                      <span style={{
                        background: '#dc2626',
                        color: 'white',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}>
                        無効
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                    パターン: {getPatternDisplayName(template)}
                  </div>

                  {template.memo && (
                    <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '8px' }}>
                      {template.memo}
                    </div>
                  )}

                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {template.category && `カテゴリ: ${template.category} | `}
                    重要度: {template.importance}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                  <button
                    onClick={() => handleEdit(template)}
                    style={{
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    編集
                  </button>

                  <button
                    onClick={() => handleToggle(template.id)}
                    style={{
                      background: template.active ? '#dc2626' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    {template.active ? '無効化' : '有効化'}
                  </button>

                  <button
                    onClick={() => handleDelete(template.id)}
                    style={{
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* テンプレート編集フォーム */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            minWidth: '400px',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              {editingTemplate ? 'テンプレートを編集' : '新しいテンプレートを作成'}
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                タイトル
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="テンプレートタイトル"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                メモ
              </label>
              <textarea
                value={formData.memo}
                onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minHeight: '60px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
                placeholder="メモ（任意）"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  カテゴリ
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
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

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  重要度
                </label>
                <select
                  value={formData.importance}
                  onChange={(e) => setFormData(prev => ({ ...prev, importance: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value={1}>1 (最低)</option>
                  <option value={2}>2 (低)</option>
                  <option value={3}>3 (普通)</option>
                  <option value={4}>4 (高)</option>
                  <option value={5}>5 (最高)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                繰り返しパターン
              </label>
              <select
                value={formData.pattern}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  pattern: e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="DAILY">毎日</option>
                <option value="WEEKLY">毎週</option>
                <option value="MONTHLY">毎月</option>
                <option value="YEARLY">毎年</option>
              </select>
            </div>

            {formData.pattern === 'WEEKLY' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  曜日選択
                </label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {['月', '火', '水', '木', '金', '土', '日'].map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const dayValue = index + 1
                        const newWeekdays = formData.weekdays?.includes(dayValue)
                          ? formData.weekdays.filter(w => w !== dayValue)
                          : [...(formData.weekdays || []), dayValue]
                        setFormData(prev => ({ ...prev, weekdays: newWeekdays }))
                      }}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        background: formData.weekdays?.includes(index + 1) ? '#3b82f6' : 'white',
                        color: formData.weekdays?.includes(index + 1) ? 'white' : '#374151',
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

            {formData.pattern === 'MONTHLY' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  日付
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.day_of_month}
                  onChange={(e) => setFormData(prev => ({ ...prev, day_of_month: parseInt(e.target.value) || 1 }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {formData.pattern === 'YEARLY' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    月
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.month_of_year}
                    onChange={(e) => setFormData(prev => ({ ...prev, month_of_year: parseInt(e.target.value) || 1 }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    日
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.day_of_year}
                    onChange={(e) => setFormData(prev => ({ ...prev, day_of_year: parseInt(e.target.value) || 1 }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.title.trim()}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: formData.title.trim() ? '#8b5cf6' : '#d1d5db',
                  color: 'white',
                  fontSize: '14px',
                  cursor: formData.title.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: '500'
                }}
              >
                {editingTemplate ? '保存' : '作成'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}