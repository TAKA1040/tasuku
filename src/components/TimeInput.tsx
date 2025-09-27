'use client'

import React, { useState, useEffect, useRef } from 'react'

interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  style?: React.CSSProperties
}

export function TimeInput({ value, onChange, placeholder = "HH:MM", style }: TimeInputProps) {
  const [hours, setHours] = useState<string>('')
  const [minutes, setMinutes] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 初期値を設定
  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':')
      setHours(h.padStart(2, '0'))
      setMinutes(m.padStart(2, '0'))
    } else {
      setHours('')
      setMinutes('')
    }
  }, [value])

  // 時間と分の変更をまとめて通知
  const updateTime = (newHours: string, newMinutes: string) => {
    if (newHours && newMinutes) {
      const formattedTime = `${newHours.padStart(2, '0')}:${newMinutes.padStart(2, '0')}`
      onChange(formattedTime)
    } else {
      onChange('')
    }
  }

  // 時間の調整（上下キー）
  const adjustHours = (direction: 'up' | 'down') => {
    const currentHours = parseInt(hours || '0')
    let newHours: number

    if (direction === 'up') {
      newHours = currentHours >= 23 ? 0 : currentHours + 1
    } else {
      newHours = currentHours <= 0 ? 23 : currentHours - 1
    }

    const newHoursStr = newHours.toString().padStart(2, '0')
    setHours(newHoursStr)
    updateTime(newHoursStr, minutes || '00')
  }

  // 分の調整（10分刻み）
  const adjustMinutes = (direction: 'up' | 'down') => {
    const currentMinutes = parseInt(minutes || '0')
    let newMinutes: number

    if (direction === 'up') {
      newMinutes = currentMinutes >= 50 ? 0 : currentMinutes + 10
    } else {
      newMinutes = currentMinutes <= 0 ? 50 : currentMinutes - 10
    }

    const newMinutesStr = newMinutes.toString().padStart(2, '0')
    setMinutes(newMinutesStr)
    updateTime(hours || '00', newMinutesStr)
  }

  // キーボードイベント
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isEditing) return

    e.preventDefault()

    switch (e.key) {
      case 'ArrowUp':
        if (e.shiftKey) {
          adjustMinutes('up')
        } else {
          adjustHours('up')
        }
        break
      case 'ArrowDown':
        if (e.shiftKey) {
          adjustMinutes('down')
        } else {
          adjustHours('down')
        }
        break
      case 'Tab':
        e.preventDefault()
        if (e.shiftKey) {
          adjustMinutes('down')
        } else {
          adjustMinutes('up')
        }
        break
      case 'Escape':
        setIsEditing(false)
        inputRef.current?.blur()
        break
      case 'Enter':
        setIsEditing(false)
        inputRef.current?.blur()
        break
    }
  }

  // 直接入力の処理
  const handleDirectInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^0-9:]/g, '')

    if (input.includes(':')) {
      const [h, m] = input.split(':')
      const validHours = Math.min(parseInt(h || '0'), 23).toString().padStart(2, '0')
      const validMinutes = Math.min(parseInt(m || '0'), 59).toString().padStart(2, '0')

      setHours(validHours)
      setMinutes(validMinutes)
      updateTime(validHours, validMinutes)
    }
  }

  // クリアボタン
  const handleClear = () => {
    setHours('')
    setMinutes('')
    onChange('')
  }

  // 時間選択ボタン
  const quickTimes = ['09:00', '12:00', '15:00', '18:00', '21:00']

  const displayValue = hours && minutes ? `${hours}:${minutes}` : ''

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleDirectInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsEditing(true)}
        onBlur={() => setIsEditing(false)}
        placeholder={placeholder}
        style={{
          ...style,
          paddingRight: '60px' // クリアボタンのスペース
        }}
      />

      {/* クリアボタン */}
      {displayValue && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: '4px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '2px',
            padding: '1px 4px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      )}

      {/* キーボードヘルプ */}
      {isEditing && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          right: '0',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '3px',
          padding: '8px',
          fontSize: '11px',
          zIndex: 1000,
          marginTop: '2px'
        }}>
          <div>↑↓: 時間 | Shift+↑↓: 分(10分刻み)</div>
          <div>Tab: 分+10 | Enter: 確定</div>

          {/* クイック時間選択 */}
          <div style={{ marginTop: '4px' }}>
            {quickTimes.map(time => (
              <button
                key={time}
                type="button"
                onClick={() => {
                  const [h, m] = time.split(':')
                  setHours(h)
                  setMinutes(m)
                  updateTime(h, m)
                  setIsEditing(false)
                }}
                style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '2px',
                  padding: '2px 4px',
                  fontSize: '10px',
                  marginRight: '2px',
                  cursor: 'pointer'
                }}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}