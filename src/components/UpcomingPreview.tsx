'use client'

import React, { memo, useState, useMemo } from 'react'
import type { TaskWithUrgency, Task } from '@/lib/db/schema'
import type { UnifiedTask } from '@/lib/types/unified-task'
import { DisplayNumberUtils } from '@/lib/types/unified-task'
import { ImportanceDot } from '@/components/ImportanceDot'
// import { QuickMoves } from '@/lib/utils/date-jst' // 将来使用予定

interface UpcomingPreviewProps {
  upcomingTasks: TaskWithUrgency[]
  onComplete: (taskId: string) => void
  onEdit: (task: UnifiedTask) => void
  onDelete: (taskId: string) => void
}

function UpcomingPreview({ upcomingTasks, onComplete, onEdit, onDelete }: UpcomingPreviewProps) {
  // 表示期間フィルター状態
  const [showDays, setShowDays] = useState<number>(7)

  // 明日以降の未来の予定のみを表示するためのフィルタリング
  const filteredTasks = useMemo(() => {
    // まず明日以降（days_from_today >= 1）にフィルター
    const futureTasks = upcomingTasks.filter(task => task.days_from_today >= 1)

    // 次に選択した日数でフィルタリング（全期間の場合は制限なし）
    return showDays === 99999
      ? futureTasks
      : futureTasks.filter(task => task.days_from_today <= showDays)
  }, [upcomingTasks, showDays])

  // 日付でフォーマットするヘルパー関数
  const formatDueDateForDisplay = (dateString?: string | null): string => {
    if (!dateString) return '-'
    if (dateString === '2999-12-31') return 'なし'

    const date = new Date(dateString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}/${day}`
  }

  if (filteredTasks.length === 0) {
    return (
      <section style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', margin: '0' }}>
            近々の予告（明日以降・{showDays === 99999 ? '全期間' : `${showDays}日以内`}）
          </h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
            <span style={{ color: '#6b7280' }}>表示期間:</span>
            {[
              { value: 7, label: '7日' },
              { value: 30, label: '30日' },
              { value: 90, label: '3ヶ月' },
              { value: 99999, label: '全期間' }
            ].map(({ value, label }) => (
              <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#374151', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="showDays"
                  value={value}
                  checked={showDays === value}
                  onChange={() => setShowDays(value)}
                  style={{ margin: '0', cursor: 'pointer' }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div style={{
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          {showDays === 99999 ? '明日以降の予告はありません' : `明日から${showDays}日以内に予告はありません`}
        </div>
      </section>
    )
  }

  return (
    <section style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '500', margin: '0' }}>
          近々の予告（明日以降・{showDays === 99999 ? '全期間' : `${showDays}日以内`}・{filteredTasks.length}件）
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
          <span style={{ color: '#6b7280' }}>表示期間:</span>
          {[
            { value: 7, label: '7日' },
            { value: 30, label: '30日' },
            { value: 90, label: '3ヶ月' },
            { value: 99999, label: '全期間' }
          ].map(({ value, label }) => (
            <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#374151', cursor: 'pointer' }}>
              <input
                type="radio"
                name="showDays"
                value={value}
                checked={showDays === value}
                onChange={() => setShowDays(value)}
                style={{ margin: '0', cursor: 'pointer' }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '60px' }}>番号</th>
              <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '40px' }}>完了</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600', width: '60px' }}>種別</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>タイトル</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600', width: '80px' }}>カテゴリ</th>
              <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '90px' }}>期限</th>
              <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '80px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map(({ task, days_from_today }, index) => (
              <tr key={task.id}
                  style={{
                    borderTop: index > 0 ? '1px solid #f3f4f6' : 'none',
                    backgroundColor: 'transparent'
                  }}>
                {/* 統一番号表示 */}
                <td style={{ padding: '8px', textAlign: 'center', fontSize: '11px', fontFamily: 'monospace' }}>
                  <span style={{
                    padding: '2px 4px',
                    borderRadius: '3px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    fontWeight: '600'
                  }}>
                    {task.display_number ? DisplayNumberUtils.formatCompact(task.display_number) : '-'}
                  </span>
                </td>

                {/* 完了チェックボックス */}
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <button
                    onClick={() => onComplete(task.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      transition: 'all 0.15s ease'
                    }}
                    title="タスクを完了する"
                  >
                  </button>
                </td>

                {/* 種別 */}
                <td style={{ padding: '8px', fontSize: '11px', color: '#6b7280' }}>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#f0f9ff',
                    color: '#1e40af',
                    fontSize: '9px',
                    fontWeight: '500'
                  }}>
                    予告
                  </span>
                </td>

                {/* タイトル */}
                <td style={{ padding: '8px', fontSize: '14px', fontWeight: '500' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* 重要度インディケーター */}
                    {task.importance && (
                      <ImportanceDot importance={task.importance} />
                    )}
                    <span>{task.title}</span>
                    <span style={{
                      color: '#6b7280',
                      fontSize: '11px',
                      backgroundColor: '#fef3c7',
                      padding: '1px 4px',
                      borderRadius: '3px'
                    }}>
                      {days_from_today === 1 ? '明日' : `${days_from_today}日後`}
                    </span>
                  </div>
                </td>

                {/* カテゴリ */}
                <td style={{ padding: '8px', fontSize: '12px', color: '#6b7280' }}>
                  {task.category || '-'}
                </td>

                {/* 期限 */}
                <td style={{ padding: '8px', fontSize: '11px', color: '#374151', textAlign: 'center' }}>
                  {task.due_date ? (
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      fontSize: '10px',
                      fontWeight: '500'
                    }}>
                      {formatDueDateForDisplay(task.due_date)}
                    </span>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '10px' }}>-</span>
                  )}
                </td>

                {/* 操作 */}
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                    {/* 編集ボタン */}
                    <button
                      onClick={() => onEdit({
                        ...task,
                        user_id: 'user_id' in task ? (task as Task & { user_id?: string }).user_id || '' : '',
                        display_number: 'display_number' in task ? (task as Task & { display_number?: string }).display_number || '' : '',
                        task_type: 'NORMAL',
                        recurring_pattern: undefined,
                        recurring_interval: undefined,
                        recurring_weekdays: undefined,
                        recurring_day: undefined
                      } as UnifiedTask)}
                      style={{
                        padding: '4px',
                        fontSize: '12px',
                        border: 'none',
                        borderRadius: '3px',
                        backgroundColor: 'transparent',
                        color: '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        transition: 'all 0.15s ease'
                      }}
                      title="タスクを編集"
                    >
                      ✏️
                    </button>

                    {/* 削除ボタン */}
                    <button
                      onClick={() => {
                        if (confirm('このタスクを削除しますか？')) {
                          onDelete(task.id)
                        }
                      }}
                      style={{
                        padding: '4px',
                        fontSize: '12px',
                        border: 'none',
                        borderRadius: '3px',
                        backgroundColor: 'transparent',
                        color: '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        transition: 'all 0.15s ease'
                      }}
                      title="タスクを削除"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default memo(UpcomingPreview)
export { UpcomingPreview }