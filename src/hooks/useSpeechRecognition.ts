'use client'

import { useState, useEffect, useRef } from 'react'

interface UseSpeechRecognitionProps {
  onResult?: (transcript: string) => void
  onError?: (error: string) => void
  continuous?: boolean
  interimResults?: boolean
  lang?: string
}

export function useSpeechRecognition({
  onResult,
  onError,
  continuous = false,
  interimResults = true,
  lang = 'ja-JP'
}: UseSpeechRecognitionProps = {}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // ブラウザ対応チェック
  useEffect(() => {
    const SpeechRecognitionClass = 
      window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (SpeechRecognitionClass) {
      setIsSupported(true)
      const recognition = new SpeechRecognitionClass()
      
      recognition.continuous = continuous
      recognition.interimResults = interimResults
      recognition.lang = lang
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
        console.log('音声認識開始')
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        let currentInterimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i]
          
          if (result.isFinal) {
            finalTranscript += result[0].transcript
          } else {
            currentInterimTranscript += result[0].transcript
          }
        }

        if (finalTranscript) {
          const fullTranscript = transcript + finalTranscript
          setTranscript(fullTranscript)
          setInterimTranscript('')
          if (onResult) onResult(fullTranscript)
        } else {
          setInterimTranscript(currentInterimTranscript)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorMessage = `音声認識エラー: ${event.error}`
        console.error(errorMessage)
        if (onError) onError(errorMessage)
        setIsListening(false)
      }

      recognition.onend = () => {
        console.log('音声認識終了')
        setIsListening(false)
        setInterimTranscript('')
      }

      recognitionRef.current = recognition
    } else {
      setIsSupported(false)
      console.warn('このブラウザは音声認識に対応していません')
    }
  }, [continuous, interimResults, lang, onResult, onError, transcript])

  const startListening = () => {
    if (recognitionRef.current && isSupported && !isListening) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('音声認識開始エラー:', error)
        if (onError) onError('音声認識を開始できませんでした')
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const resetTranscript = () => {
    setTranscript('')
    setInterimTranscript('')
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    toggleListening
  }
}