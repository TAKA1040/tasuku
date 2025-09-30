'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface SwipeableTaskRowProps {
  children: React.ReactNode
  onSwipeComplete: () => void
  onSwipeUndo?: () => void
  isCompleted: boolean
  disabled?: boolean
}

export function SwipeableTaskRow({ 
  children, 
  onSwipeComplete, 
  onSwipeUndo,
  isCompleted, 
  disabled = false 
}: SwipeableTaskRowProps) {
  const [translateX, setTranslateX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showUndoAction, setShowUndoAction] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const currentX = useRef(0)

  const SWIPE_THRESHOLD = 80 // スワイプ完了閾値
  const MAX_TRANSLATE = 120 // 最大スワイプ距離

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return
    
    startX.current = e.touches[0].clientX
    currentX.current = startX.current
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return
    
    currentX.current = e.touches[0].clientX
    const deltaX = currentX.current - startX.current
    
    // 完了済みタスクは右スワイプ（元に戻す）、未完了は左スワイプ（完了）
    if (isCompleted) {
      // 右スワイプで元に戻す
      if (deltaX > 0) {
        setTranslateX(Math.min(deltaX, MAX_TRANSLATE))
      }
    } else {
      // 左スワイプで完了
      if (deltaX < 0) {
        setTranslateX(Math.max(deltaX, -MAX_TRANSLATE))
      }
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging || disabled) return
    
    setIsDragging(false)
    const deltaX = currentX.current - startX.current
    
    if (isCompleted) {
      // 完了済みタスク：右スワイプで元に戻す
      if (deltaX > SWIPE_THRESHOLD) {
        setShowUndoAction(true)
        setTimeout(() => {
          if (onSwipeUndo) onSwipeUndo()
          setShowUndoAction(false)
          setTranslateX(0)
        }, 200)
      } else {
        setTranslateX(0)
      }
    } else {
      // 未完了タスク：左スワイプで完了
      if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        setShowUndoAction(true)
        setTimeout(() => {
          onSwipeComplete()
          setShowUndoAction(false)
          setTranslateX(0)
        }, 200)
      } else {
        setTranslateX(0)
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return
    
    startX.current = e.clientX
    currentX.current = startX.current
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled) return

    currentX.current = e.clientX
    const deltaX = currentX.current - startX.current

    if (isCompleted) {
      if (deltaX > 0) {
        setTranslateX(Math.min(deltaX, MAX_TRANSLATE))
      }
    } else {
      if (deltaX < 0) {
        setTranslateX(Math.max(deltaX, -MAX_TRANSLATE))
      }
    }
  }

  const handleMouseUp = useCallback(() => {
    if (!isDragging || disabled) return
    
    setIsDragging(false)
    const deltaX = currentX.current - startX.current
    
    if (isCompleted) {
      if (deltaX > SWIPE_THRESHOLD) {
        setShowUndoAction(true)
        setTimeout(() => {
          if (onSwipeUndo) onSwipeUndo()
          setShowUndoAction(false)
          setTranslateX(0)
        }, 200)
      } else {
        setTranslateX(0)
      }
    } else {
      if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        setShowUndoAction(true)
        setTimeout(() => {
          onSwipeComplete()
          setShowUndoAction(false)
          setTranslateX(0)
        }, 200)
      } else {
        setTranslateX(0)
      }
    }
  }, [isDragging, disabled, isCompleted, onSwipeComplete, onSwipeUndo])

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && !disabled) {
        currentX.current = e.clientX
        const deltaX = currentX.current - startX.current
        
        if (isCompleted) {
          if (deltaX > 0) {
            setTranslateX(Math.min(deltaX, MAX_TRANSLATE))
          }
        } else {
          if (deltaX < 0) {
            setTranslateX(Math.max(deltaX, -MAX_TRANSLATE))
          }
        }
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp()
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, disabled, isCompleted, handleMouseUp])

  const getActionIcon = () => {
    if (isCompleted) {
      return translateX > SWIPE_THRESHOLD/2 ? '↺' : '↷'
    } else {
      return Math.abs(translateX) > SWIPE_THRESHOLD/2 ? '✓' : '→'
    }
  }

  const getActionColor = () => {
    if (isCompleted) {
      return translateX > SWIPE_THRESHOLD/2 ? '#f59e0b' : '#d1d5db'
    } else {
      return Math.abs(translateX) > SWIPE_THRESHOLD/2 ? '#10b981' : '#d1d5db'
    }
  }

  const getActionOpacity = () => {
    const progress = Math.abs(translateX) / SWIPE_THRESHOLD
    return Math.min(progress, 1)
  }

  return (
    <div
      ref={rowRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'pan-y', // 縦スクロールは許可、横はカスタム処理
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      {/* スワイプアクション背景 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: isCompleted ? undefined : 0,
          left: isCompleted ? 0 : undefined,
          width: '100%',
          height: '100%',
          background: getActionColor(),
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCompleted ? 'flex-start' : 'flex-end',
          paddingLeft: isCompleted ? '20px' : '0',
          paddingRight: isCompleted ? '0' : '20px',
          opacity: getActionOpacity(),
          transition: isDragging ? 'none' : 'opacity 0.2s ease',
          color: 'white',
          fontSize: '20px',
          fontWeight: '600'
        }}
      >
        {getActionIcon()} {isCompleted ? '元に戻す' : '完了'}
      </div>

      {/* メインコンテンツ */}
      <div
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease',
          backgroundColor: showUndoAction ? 
            (isCompleted ? '#fef3c7' : '#ecfdf5') : 
            'inherit',
          position: 'relative',
          zIndex: 1
        }}
      >
        {children}
      </div>

      {/* スワイプヒント（初回のみ表示） */}
      {!disabled && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: isCompleted ? undefined : '10px',
            left: isCompleted ? '10px' : undefined,
            transform: 'translateY(-50%)',
            fontSize: '12px',
            color: '#9ca3af',
            opacity: isDragging ? 0 : 0.4,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
            zIndex: 0
          }}
        >
          {isCompleted ? '→ 元に戻す' : '← 完了'}
        </div>
      )}
    </div>
  )
}