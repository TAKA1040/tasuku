'use client'

import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useTheme } from '@/hooks/useTheme'

interface VoiceInputButtonProps {
  onResult: (text: string) => void
  className?: string
  size?: 'small' | 'medium' | 'large'
}

export function VoiceInputButton({ onResult, className, size = 'medium' }: VoiceInputButtonProps) {
  const { actualTheme } = useTheme()
  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    toggleListening,
    resetTranscript
  } = useSpeechRecognition({
    onResult: (finalText) => {
      onResult(finalText)
      resetTranscript()
    },
    onError: (error) => {
      console.error('音声認識エラー:', error)
    },
    continuous: false,
    interimResults: true
  })

  if (!isSupported) {
    return null // 音声認識非対応の場合は非表示
  }

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { width: '24px', height: '24px', fontSize: '10px' }
      case 'large':
        return { width: '48px', height: '48px', fontSize: '20px' }
      case 'medium':
      default:
        return { width: '32px', height: '32px', fontSize: '14px' }
    }
  }

  const getStatusColor = () => {
    if (isListening) {
      return '#dc2626' // 録音中は赤
    }
    if (interimTranscript) {
      return '#f59e0b' // 音声検出中は黄
    }
    return actualTheme === 'dark' ? '#60a5fa' : '#3b82f6' // 通常時は青
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={toggleListening}
        disabled={!isSupported}
        className={className}
        style={{
          ...getSizeStyle(),
          borderRadius: '50%',
          border: 'none',
          backgroundColor: getStatusColor(),
          color: 'white',
          cursor: isSupported ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: isListening ? '0 0 20px rgba(220, 38, 38, 0.5)' : '0 2px 4px rgba(0,0,0,0.1)',
          animation: isListening ? 'pulse 1.5s ease-in-out infinite alternate' : 'none'
        }}
        title={
          isListening 
            ? '音声入力中... クリックで停止'
            : '音声でタスクを入力'
        }
      >
        {isListening ? '●' : '🎙️'}
      </button>

      {/* 音声認識中のリアルタイム表示 */}
      {(interimTranscript || isListening) && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '8px',
            backgroundColor: actualTheme === 'dark' ? '#374151' : '#ffffff',
            color: actualTheme === 'dark' ? '#f9fafb' : '#1f2937',
            border: `1px solid ${actualTheme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            minWidth: '120px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          {isListening && !interimTranscript && (
            <span style={{ color: '#6b7280' }}>聞き取り中...</span>
          )}
          {interimTranscript && (
            <span style={{ color: getStatusColor() }}>{interimTranscript}</span>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          from {
            box-shadow: 0 0 20px rgba(220, 38, 38, 0.5);
          }
          to {
            box-shadow: 0 0 30px rgba(220, 38, 38, 0.8);
          }
        }
      `}</style>
    </div>
  )
}