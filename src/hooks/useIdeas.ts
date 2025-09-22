'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabaseDb as db } from '@/lib/db/supabase-database'
import type { IdeaItem } from '@/components/IdeaBox'

const STORAGE_KEY = 'tasuku-ideas'

export function useIdeas(isDbInitialized: boolean = false) {
  const [ideas, setIdeas] = useState<IdeaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Database からアイデアを読み込み
  const loadIdeas = useCallback(async () => {
    if (!isDbInitialized) {
      console.log('Database not yet initialized, trying localStorage fallback')
      loadIdeasFromLocalStorage()
      return
    }

    try {
      setLoading(true)
      const dbIdeas = await db.getAllIdeas()

      // Convert Idea to IdeaItem format
      const ideaItems: IdeaItem[] = dbIdeas.map(idea => ({
        id: idea.id,
        text: idea.text,
        completed: idea.completed,
        created_at: idea.created_at
      }))

      setIdeas(ideaItems)
      setError(null)

      // Migrate localStorage data if database is empty and localStorage has data
      if (ideaItems.length === 0) {
        await migrateFromLocalStorage()
      }
    } catch (err) {
      console.error('Failed to load ideas from database:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Fallback to localStorage on database error
      loadIdeasFromLocalStorage()
    } finally {
      setLoading(false)
    }
  }, [isDbInitialized])

  // LocalStorage fallback
  const loadIdeasFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedIdeas = JSON.parse(stored)
        setIdeas(parsedIdeas)
      }
    } catch (error) {
      console.error('Failed to load ideas from localStorage:', error)
    } finally {
      setLoading(false)
    }
  }

  // Migrate localStorage data to database
  const migrateFromLocalStorage = async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedIdeas: IdeaItem[] = JSON.parse(stored)
        console.log(`Migrating ${parsedIdeas.length} ideas from localStorage to database`)

        for (const idea of parsedIdeas) {
          await db.createIdea({
            text: idea.text,
            completed: idea.completed
          })
        }

        // Reload from database to get the migrated data
        const dbIdeas = await db.getAllIdeas()
        const ideaItems: IdeaItem[] = dbIdeas.map(idea => ({
          id: idea.id,
          text: idea.text,
          completed: idea.completed,
          created_at: idea.created_at
        }))
        setIdeas(ideaItems)

        // Clear localStorage after successful migration
        localStorage.removeItem(STORAGE_KEY)
        console.log('Ideas migration completed successfully')
      }
    } catch (error) {
      console.error('Failed to migrate ideas from localStorage:', error)
    }
  }

  // 新しいアイデアを追加
  const addIdea = async (text: string) => {
    if (!isDbInitialized) {
      // Fallback to localStorage
      const newIdea: IdeaItem = {
        id: crypto.randomUUID(),
        text: text.trim(),
        completed: false,
        created_at: new Date().toISOString()
      }
      const updatedIdeas = [newIdea, ...ideas]
      saveIdeasToLocalStorage(updatedIdeas)
      return
    }

    try {
      await db.createIdea({
        text: text.trim(),
        completed: false
      })
      await loadIdeas() // Reload from database
    } catch (err) {
      console.error('Failed to add idea:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // アイデアの完了状態を切り替え
  const toggleIdea = async (id: string) => {
    if (!isDbInitialized) {
      // Fallback to localStorage
      const updatedIdeas = ideas.map(idea =>
        idea.id === id ? { ...idea, completed: !idea.completed } : idea
      )
      saveIdeasToLocalStorage(updatedIdeas)
      return
    }

    try {
      const idea = ideas.find(i => i.id === id)
      if (!idea) return

      await db.updateIdea(id, { completed: !idea.completed })
      await loadIdeas() // Reload from database
    } catch (err) {
      console.error('Failed to toggle idea:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // アイデアを編集
  const editIdea = async (id: string, newText: string) => {
    if (!isDbInitialized) {
      // Fallback to localStorage
      const updatedIdeas = ideas.map(idea =>
        idea.id === id ? { ...idea, text: newText.trim() } : idea
      )
      saveIdeasToLocalStorage(updatedIdeas)
      return
    }

    try {
      await db.updateIdea(id, { text: newText.trim() })
      await loadIdeas() // Reload from database
    } catch (err) {
      console.error('Failed to edit idea:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // アイデアを削除
  const deleteIdea = async (id: string) => {
    if (!isDbInitialized) {
      // Fallback to localStorage
      const updatedIdeas = ideas.filter(idea => idea.id !== id)
      saveIdeasToLocalStorage(updatedIdeas)
      return
    }

    try {
      await db.deleteIdea(id)
      await loadIdeas() // Reload from database
    } catch (err) {
      console.error('Failed to delete idea:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // LocalStorage保存ヘルパー
  const saveIdeasToLocalStorage = (newIdeas: IdeaItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newIdeas))
      setIdeas(newIdeas)
    } catch (error) {
      console.error('Failed to save ideas to localStorage:', error)
    }
  }

  // コンポーネントマウント時にアイデアを読み込み
  useEffect(() => {
    loadIdeas()
  }, [isDbInitialized, loadIdeas])

  return {
    ideas,
    loading,
    error,
    addIdea,
    toggleIdea,
    editIdea,
    deleteIdea,
    reload: loadIdeas
  }
}