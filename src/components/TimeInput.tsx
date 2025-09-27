'use client'

import React, { useState, useEffect } from 'react'

interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  style?: React.CSSProperties
}

export function TimeInput({ value, onChange, placeholder = "HH:MM", style }: TimeInputProps) {
  const [hours, setHours] = useState<string>('')
  const [minutes, setMinutes] = useState<string>('')

  // 時間と分のオプション生成
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i.toString().padStart(2, '0'),
    label: i.toString().padStart(2, '0')
  }))

  const minuteOptions = Array.from({ length: 6 }, (_, i) => ({
    value: (i * 10).toString().padStart(2, '0'),
    label: (i * 10).toString().padStart(2, '0')
  }))

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

  // 時間変更ハンドラー
  const handleHoursChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHours = e.target.value
    setHours(newHours)
    if (newHours && minutes) {
      updateTime(newHours, minutes)
    }
  }

  // 分変更ハンドラー
  const handleMinutesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinutes = e.target.value
    setMinutes(newMinutes)
    if (hours && newMinutes) {
      updateTime(hours, newMinutes)
    }
  }

  // キーボードナビゲーション
  const handleKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>, type: 'hours' | 'minutes') => {
    const options = type === 'hours' ? hourOptions : minuteOptions
    const currentValue = type === 'hours' ? hours : minutes
    const currentIndex = options.findIndex(opt => opt.value === currentValue)

    let newIndex = currentIndex

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      newIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      newIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0
    } else {
      return
    }

    const newValue = options[newIndex].value
    if (type === 'hours') {
      setHours(newValue)
      if (newValue && minutes) updateTime(newValue, minutes)
    } else {
      setMinutes(newValue)
      if (hours && newValue) updateTime(hours, newValue)
    }
  }

  // クリアボタン
  const handleClear = () => {
    setHours('')
    setMinutes('')
    onChange('')
  }

  // クイック時間選択
  const quickTimes = ['09:00', '12:00', '15:00', '18:00', '21:00']

  return (
    <div style={{ ...style }}>
      {/* 時間と分の選択 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
        <select
          value={hours}
          onChange={handleHoursChange}
          onKeyDown={(e) => handleKeyDown(e, 'hours')}
          style={{
            padding: '3px 6px',
            border: '1px solid #ddd',
            borderRadius: '3px',
            fontSize: '12px',
            minWidth: '50px',
            flex: '1'
          }}
        >
          <option value="">時</option>
          {hourOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#6b7280' }}>:</span>

        <select
          value={minutes}
          onChange={handleMinutesChange}
          onKeyDown={(e) => handleKeyDown(e, 'minutes')}
          style={{
            padding: '3px 6px',
            border: '1px solid #ddd',
            borderRadius: '3px',
            fontSize: '12px',
            minWidth: '50px',
            flex: '1'
          }}
        >
          <option value="">分</option>
          {minuteOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* クリアボタン */}
        {(hours || minutes) && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              padding: '2px 6px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* クイック選択ボタン */}
      <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
        {quickTimes.map(time => (
          <button
            key={time}
            type="button"
            onClick={() => {
              const [h, m] = time.split(':')
              setHours(h)
              setMinutes(m)
              updateTime(h, m)
            }}
            style={{
              background: hours === time.split(':')[0] && minutes === time.split(':')[1]
                ? '#0056b3' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '2px',
              padding: '2px 4px',
              fontSize: '9px',
              cursor: 'pointer',
              minWidth: '32px'
            }}
          >
            {time}
          </button>
        ))}
      </div>
    </div>
  )
}