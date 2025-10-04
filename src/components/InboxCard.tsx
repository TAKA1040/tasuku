'use client'

import { useState } from 'react'
import type { UnifiedTask } from '@/lib/types/unified-task'
import { extractDomain, isYouTubeUrl, getYouTubeThumbnail, getFaviconUrl } from '@/lib/utils/parse-inbox-content'
import { formatDateForDisplay } from '@/lib/utils/date-jst'

interface InboxCardProps {
  item: UnifiedTask
  onConvertToTask: (item: UnifiedTask) => void
  onDelete: (id: string) => void
}

export function InboxCard({ item, onConvertToTask, onDelete }: InboxCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const hasUrls = item.urls && item.urls.length > 0
  const youtubeUrl = hasUrls && item.urls && isYouTubeUrl(item.urls[0]) ? item.urls[0] : null
  const thumbnailUrl = youtubeUrl ? getYouTubeThumbnail(youtubeUrl) : null

  return (
    <div style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      transition: 'all 0.2s ease',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}
    className="inbox-card"
    >
      {/* タイトル */}
      <div style={{
        fontSize: '15px',
        fontWeight: '500',
        color: 'var(--text-primary)',
        marginBottom: hasUrls || item.memo ? '12px' : '8px',
        lineHeight: '1.5'
      }}>
        {item.title}
      </div>

      {/* メモ */}
      {item.memo && (
        <div style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          marginBottom: hasUrls ? '12px' : '8px',
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap'
        }}>
          {item.memo}
        </div>
      )}

      {/* YouTube サムネイル */}
      {thumbnailUrl && (
        <div style={{ marginBottom: '12px' }}>
          <a href={youtubeUrl!} target="_blank" rel="noopener noreferrer">
            <img
              src={thumbnailUrl}
              alt="YouTube thumbnail"
              style={{
                width: '100%',
                maxWidth: '320px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            />
          </a>
        </div>
      )}

      {/* URLs */}
      {hasUrls && item.urls && (
        <div style={{ marginBottom: '12px' }}>
          {item.urls.map((url, index) => (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                marginBottom: '4px',
                background: 'var(--bg-secondary)',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#3b82f6',
                textDecoration: 'none',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e0e7ff'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
            >
              <img
                src={getFaviconUrl(url)}
                alt=""
                width={16}
                height={16}
                style={{ flexShrink: 0 }}
              />
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {extractDomain(url)}
              </span>
            </a>
          ))}
        </div>
      )}

      {/* 作成日時 */}
      <div style={{
        fontSize: '11px',
        color: '#9ca3af',
        marginBottom: '12px'
      }}>
        {item.created_at ? formatDateForDisplay(item.created_at.split('T')[0]) : ''}
        {item.created_at && item.created_at.includes('T') && (
          <span style={{ marginLeft: '8px' }}>
            {item.created_at.split('T')[1].slice(0, 5)}
          </span>
        )}
      </div>

      {/* アクションボタン */}
      <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end'
      }}>
        {showDeleteConfirm ? (
          <>
            <button
              onClick={() => {
                onDelete(item.id)
                setShowDeleteConfirm(false)
              }}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              本当に削除
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              キャンセル
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onConvertToTask(item)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              📝 タスク化
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                background: 'transparent',
                color: '#6b7280',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              🗑️ 削除
            </button>
          </>
        )}
      </div>
    </div>
  )
}
