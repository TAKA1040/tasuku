'use client'

import { useState, useEffect } from 'react'
import type { IdeaItem } from '@/components/IdeaBox'

const STORAGE_KEY = 'tasuku-ideas'

export function useIdeas() {
  const [ideas, setIdeas] = useState<IdeaItem[]>([])
  const [loading, setLoading] = useState(true)

  // LocalStorageからアイデアを読み込み
  const loadIdeas = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedIdeas = JSON.parse(stored)
        setIdeas(parsedIdeas)
      }
    } catch (error) {
      console.error('Failed to load ideas:', error)
    } finally {
      setLoading(false)
    }
  }

  // LocalStorageにアイデアを保存
  const saveIdeas = (newIdeas: IdeaItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newIdeas))
      setIdeas(newIdeas)
    } catch (error) {
      console.error('Failed to save ideas:', error)
    }
  }

  // 新しいアイデアを追加
  const addIdea = (text: string) => {
    const newIdea: IdeaItem = {
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    }
    
    const updatedIdeas = [newIdea, ...ideas]
    saveIdeas(updatedIdeas)
  }

  // アイデアの完了状態を切り替え
  const toggleIdea = (id: string) => {
    const updatedIdeas = ideas.map(idea =>
      idea.id === id ? { ...idea, completed: !idea.completed } : idea
    )
    saveIdeas(updatedIdeas)
  }

  // アイデアを削除
  const deleteIdea = (id: string) => {
    const updatedIdeas = ideas.filter(idea => idea.id !== id)
    saveIdeas(updatedIdeas)
  }

  // コンポーネントマウント時にアイデアを読み込み
  useEffect(() => {
    loadIdeas()
  }, [])

  return {
    ideas,
    loading,
    addIdea,
    toggleIdea,
    deleteIdea
  }
}