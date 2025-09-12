'use client'

import { useState } from 'react'
import { TASK_CATEGORIES, TASK_IMPORTANCE_LABELS } from '@/lib/db/schema'

interface SearchFilterOptions {
  searchQuery: string
  category: string
  importance: string
  urgency: string
  status: string
}

interface TaskSearchFilterProps {
  filters: SearchFilterOptions
  onFiltersChange: (filters: SearchFilterOptions) => void
  onClear: () => void
}

export function TaskSearchFilter({ filters, onFiltersChange, onClear }: TaskSearchFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSearchChange = (searchQuery: string) => {
    onFiltersChange({ ...filters, searchQuery })
  }

  const handleCategoryChange = (category: string) => {
    onFiltersChange({ ...filters, category })
  }

  const handleImportanceChange = (importance: string) => {
    onFiltersChange({ ...filters, importance })
  }

  const handleUrgencyChange = (urgency: string) => {
    onFiltersChange({ ...filters, urgency })
  }

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status })
  }

  const hasActiveFilters = filters.searchQuery || filters.category || filters.importance || filters.urgency || filters.status

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      padding: '16px',
      marginBottom: '16px'
    }}>
      {/* 検索バー */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="タスクを検索..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 40px 10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          <div style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            fontSize: '18px'
          }}>
            🔍
          </div>
        </div>
      </div>

      {/* フィルターボタン */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: isExpanded ? '16px' : '0'
      }}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '14px',
            color: '#374151',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          🎛️ フィルター {isExpanded ? '▲' : '▼'}
          {hasActiveFilters && (
            <span style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '12px',
              marginLeft: '4px'
            }}>
              {[filters.category, filters.importance, filters.urgency, filters.status].filter(Boolean).length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={onClear}
            style={{
              background: 'none',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '14px',
              color: '#ef4444',
              cursor: 'pointer'
            }}
          >
            ✕ クリア
          </button>
        )}
      </div>

      {/* フィルターオプション */}
      {isExpanded && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb'
        }}>
          {/* ステータス */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px',
              color: '#374151'
            }}>
              ステータス
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#fff',
                boxSizing: 'border-box'
              }}
            >
              <option value="">すべて</option>
              <option value="pending">未完了のみ</option>
              <option value="completed">完了済みのみ</option>
            </select>
          </div>

          {/* カテゴリ */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px',
              color: '#374151'
            }}>
              カテゴリ
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#fff',
                boxSizing: 'border-box'
              }}
            >
              <option value="">すべてのカテゴリ</option>
              {Object.values(TASK_CATEGORIES).map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
              <option value="未分類">未分類</option>
            </select>
          </div>

          {/* 重要度 */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px',
              color: '#374151'
            }}>
              重要度
            </label>
            <select
              value={filters.importance}
              onChange={(e) => handleImportanceChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#fff',
                boxSizing: 'border-box'
              }}
            >
              <option value="">すべての重要度</option>
              {Object.entries(TASK_IMPORTANCE_LABELS)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              <option value="0">未設定</option>
            </select>
          </div>

          {/* 緊急度 */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px',
              color: '#374151'
            }}>
              緊急度
            </label>
            <select
              value={filters.urgency}
              onChange={(e) => handleUrgencyChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#fff',
                boxSizing: 'border-box'
              }}
            >
              <option value="">すべての緊急度</option>
              <option value="Overdue">期限切れ</option>
              <option value="Soon">近日中</option>
              <option value="Next7">1週間以内</option>
              <option value="Next30">1ヶ月以内</option>
              <option value="Normal">通常</option>
            </select>
          </div>
        </div>
      )}

      {/* アクティブフィルターの表示 */}
      {hasActiveFilters && (
        <div style={{
          marginTop: '12px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {filters.searchQuery && (
            <span style={{
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              検索: &quot;{filters.searchQuery}&quot;
            </span>
          )}
          {filters.status && (
            <span style={{
              backgroundColor: '#dcfce7',
              color: '#166534',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              ステータス: {filters.status === 'pending' ? '未完了' : '完了済み'}
            </span>
          )}
          {filters.category && (
            <span style={{
              backgroundColor: '#fef3c7',
              color: '#92400e',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              カテゴリ: {filters.category}
            </span>
          )}
          {filters.importance && (
            <span style={{
              backgroundColor: '#fce7f3',
              color: '#be185d',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              重要度: {TASK_IMPORTANCE_LABELS[Number(filters.importance) as keyof typeof TASK_IMPORTANCE_LABELS] || '未設定'}
            </span>
          )}
          {filters.urgency && (
            <span style={{
              backgroundColor: '#e0e7ff',
              color: '#3730a3',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              緊急度: {filters.urgency}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export type { SearchFilterOptions }