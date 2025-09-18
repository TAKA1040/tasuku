// Display Number Cell Component
// Shows and allows editing of task display numbers

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { DisplayNumberUtils } from '@/lib/types/unified-task'

interface DisplayNumberCellProps {
  displayNumber?: string // For unified tasks
  fallbackNumber?: number // For legacy tasks, use index
  isEditable?: boolean
  onUpdate?: (newSequence: number) => void
  className?: string
}

export function DisplayNumberCell({
  displayNumber,
  fallbackNumber,
  isEditable = false,
  onUpdate,
  className = ''
}: DisplayNumberCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get display value
  const displayValue = displayNumber
    ? DisplayNumberUtils.formatForDisplay(displayNumber)
    : (fallbackNumber?.toString() || '—')

  // Handle edit start
  const handleEditStart = () => {
    if (!isEditable) return
    setIsEditing(true)
    setEditValue(displayValue)
    setError(null)
  }

  // Handle edit cancel
  const handleEditCancel = () => {
    setIsEditing(false)
    setEditValue('')
    setError(null)
  }

  // Handle edit save
  const handleEditSave = () => {
    if (!onUpdate) {
      handleEditCancel()
      return
    }

    const newSequence = parseInt(editValue)

    // Validation
    if (isNaN(newSequence) || newSequence < 1 || newSequence > 999) {
      setError('番号は1-999の範囲で入力してください')
      return
    }

    try {
      onUpdate(newSequence)
      setIsEditing(false)
      setEditValue('')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました')
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Styling
  const cellClass = `
    relative px-2 py-1 text-center text-sm font-mono
    ${isEditable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
    ${className}
  `.trim()

  const editClass = `
    w-16 px-1 py-1 text-center text-sm font-mono
    border border-blue-500 rounded
    bg-white dark:bg-gray-800
    focus:outline-none focus:ring-2 focus:ring-blue-500
  `.trim()

  if (isEditing) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="number"
          min="1"
          max="999"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleEditCancel}
          className={editClass}
        />
        {error && (
          <div className="absolute top-full left-0 z-10 mt-1 p-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded shadow-lg whitespace-nowrap">
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cellClass}
      onClick={handleEditStart}
      title={isEditable ? '番号をクリックして編集' : '表示番号'}
    >
      <span className="text-gray-600 dark:text-gray-400">
        {displayValue}
      </span>
      {isEditable && (
        <span className="ml-1 text-xs text-gray-400 opacity-50">
          ✏️
        </span>
      )}
    </div>
  )
}

// Legacy Task Display Number Component
// For existing tasks that don't have unified numbering yet
export function LegacyDisplayNumber({
  index,
  prefix = ''
}: {
  index: number
  prefix?: string
}) {
  return (
    <div className="px-2 py-1 text-center text-sm font-mono text-gray-500 dark:text-gray-400">
      {prefix}{index + 1}
    </div>
  )
}

// Preview component for showing the numbering system
export function DisplayNumberPreview({
  date,
  taskType,
  sequence
}: {
  date: string
  taskType: string
  sequence: number
}) {
  const fullNumber = `${date.replace(/-/g, '')}${taskType}${sequence.toString().padStart(3, '0')}`
  const displayNumber = DisplayNumberUtils.formatForDisplay(fullNumber)

  return (
    <div className="text-xs text-gray-500 space-y-1">
      <div>内部番号: <span className="font-mono">{fullNumber}</span></div>
      <div>表示: <span className="font-mono font-bold">{displayNumber}</span></div>
    </div>
  )
}