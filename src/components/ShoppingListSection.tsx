'use client'

import { useState, useEffect } from 'react'
import { shoppingService, type ShoppingListWithItems } from '@/lib/db/shopping'
import { getTodayJST, getTomorrowJST, getDayAfterTomorrowJST } from '@/lib/utils/date-jst'

interface ShoppingListSectionProps {
  onScheduleTask: (storeName: string, items: string[], dueDate: string) => void
}

export function ShoppingListSection({ onScheduleTask }: ShoppingListSectionProps) {
  const [shoppingLists, setShoppingLists] = useState<ShoppingListWithItems[]>([])
  const [newStoreName, setNewStoreName] = useState('')
  const [isCreatingStore, setIsCreatingStore] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemText, setEditingItemText] = useState('')

  // 買い物リストを読み込み
  const loadShoppingLists = async () => {
    try {
      const lists = await shoppingService.getAllShoppingListsWithItems()
      setShoppingLists(lists)
    } catch (error) {
      console.error('Failed to load shopping lists:', error)
    }
  }

  useEffect(() => {
    loadShoppingLists()
  }, [])

  // 新しい買い物リストを作成
  const handleCreateShoppingList = async () => {
    if (!newStoreName.trim()) return

    try {
      await shoppingService.lists.createShoppingList(newStoreName.trim())
      setNewStoreName('')
      setIsCreatingStore(false)
      await loadShoppingLists()
    } catch (error) {
      console.error('Failed to create shopping list:', error)
    }
  }

  // 買い物アイテムを追加
  const handleAddItem = async (listId: string, itemName: string) => {
    if (!itemName.trim()) return

    try {
      await shoppingService.items.addShoppingItem(listId, itemName.trim())
      await loadShoppingLists()
    } catch (error) {
      console.error('Failed to add shopping item:', error)
    }
  }

  // 買い物アイテムの完了状態を切り替え
  const handleToggleItem = async (itemId: string) => {
    try {
      await shoppingService.items.toggleShoppingItemCompletion(itemId)
      await loadShoppingLists()
    } catch (error) {
      console.error('Failed to toggle shopping item:', error)
    }
  }

  // 買い物アイテムを削除
  const handleDeleteItem = async (itemId: string) => {
    try {
      await shoppingService.items.deleteShoppingItem(itemId)
      await loadShoppingLists()
    } catch (error) {
      console.error('Failed to delete shopping item:', error)
    }
  }

  // 買い物アイテムの名前を編集
  const handleEditItem = async (itemId: string, newName: string) => {
    if (!newName.trim()) return

    try {
      await shoppingService.items.updateShoppingItemName(itemId, newName.trim())
      setEditingItemId(null)
      setEditingItemText('')
      await loadShoppingLists()
    } catch (error) {
      console.error('Failed to update shopping item:', error)
    }
  }

  // 買い物リストを削除
  const handleDeleteShoppingList = async (listId: string) => {
    if (!confirm('この買い物リストを削除しますか？')) return

    try {
      await shoppingService.lists.deleteShoppingList(listId)
      await loadShoppingLists()
    } catch (error) {
      console.error('Failed to delete shopping list:', error)
    }
  }

  // スケジュールに移動
  const handleScheduleToday = (listWithItems: ShoppingListWithItems) => {
    const incompleteItemNames = listWithItems.incompleteItems.map(item => item.item_name)
    onScheduleTask(listWithItems.list.store_name, incompleteItemNames, getTodayJST())
    // 移動後にリストを削除
    handleDeleteShoppingList(listWithItems.list.id)
  }

  const handleScheduleTomorrow = (listWithItems: ShoppingListWithItems) => {
    const incompleteItemNames = listWithItems.incompleteItems.map(item => item.item_name)
    onScheduleTask(listWithItems.list.store_name, incompleteItemNames, getTomorrowJST())
    handleDeleteShoppingList(listWithItems.list.id)
  }

  const handleScheduleAfterTomorrow = (listWithItems: ShoppingListWithItems) => {
    const incompleteItemNames = listWithItems.incompleteItems.map(item => item.item_name)
    onScheduleTask(listWithItems.list.store_name, incompleteItemNames, getDayAfterTomorrowJST())
    handleDeleteShoppingList(listWithItems.list.id)
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '500',
          color: '#6b7280',
          margin: 0
        }}>
          🛒 買い物リスト
        </h3>

        {!isCreatingStore ? (
          <button
            onClick={() => setIsCreatingStore(true)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            + 新しいリスト
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="店舗名を入力"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateShoppingList()
                if (e.key === 'Escape') {
                  setIsCreatingStore(false)
                  setNewStoreName('')
                }
              }}
              style={{
                padding: '6px 8px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                width: '150px'
              }}
              autoFocus
            />
            <button
              onClick={handleCreateShoppingList}
              disabled={!newStoreName.trim()}
              style={{
                padding: '6px 8px',
                fontSize: '12px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: newStoreName.trim() ? 'pointer' : 'not-allowed',
                opacity: newStoreName.trim() ? 1 : 0.5
              }}
            >
              作成
            </button>
            <button
              onClick={() => {
                setIsCreatingStore(false)
                setNewStoreName('')
              }}
              style={{
                padding: '6px 8px',
                fontSize: '12px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              キャンセル
            </button>
          </div>
        )}
      </div>

      {shoppingLists.length === 0 ? (
        <div style={{
          padding: '12px',
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '12px',
          fontStyle: 'italic'
        }}>
          買い物リストなし
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '8px'
        }}>
          {shoppingLists.map((listWithItems) => (
            <ShoppingListCard
              key={listWithItems.list.id}
              listWithItems={listWithItems}
              onAddItem={handleAddItem}
              onToggleItem={handleToggleItem}
              onDeleteItem={handleDeleteItem}
              onEditItem={handleEditItem}
              onDeleteList={handleDeleteShoppingList}
              onScheduleToday={handleScheduleToday}
              onScheduleTomorrow={handleScheduleTomorrow}
              onScheduleAfterTomorrow={handleScheduleAfterTomorrow}
              editingItemId={editingItemId}
              editingItemText={editingItemText}
              setEditingItemId={setEditingItemId}
              setEditingItemText={setEditingItemText}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ShoppingListCardProps {
  listWithItems: ShoppingListWithItems
  onAddItem: (listId: string, itemName: string) => void
  onToggleItem: (itemId: string) => void
  onDeleteItem: (itemId: string) => void
  onEditItem: (itemId: string, newName: string) => void
  onDeleteList: (listId: string) => void
  onScheduleToday: (listWithItems: ShoppingListWithItems) => void
  onScheduleTomorrow: (listWithItems: ShoppingListWithItems) => void
  onScheduleAfterTomorrow: (listWithItems: ShoppingListWithItems) => void
  editingItemId: string | null
  editingItemText: string
  setEditingItemId: (id: string | null) => void
  setEditingItemText: (text: string) => void
}

function ShoppingListCard({
  listWithItems,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onEditItem,
  onDeleteList,
  onScheduleToday,
  onScheduleTomorrow,
  onScheduleAfterTomorrow,
  editingItemId,
  editingItemText,
  setEditingItemId,
  setEditingItemText
}: ShoppingListCardProps) {
  const [newItemName, setNewItemName] = useState('')

  const handleAddItemLocal = () => {
    if (!newItemName.trim()) return
    onAddItem(listWithItems.list.id, newItemName.trim())
    setNewItemName('')
  }

  const startEditing = (itemId: string, currentName: string) => {
    setEditingItemId(itemId)
    setEditingItemText(currentName)
  }

  const handleEditSubmit = () => {
    if (editingItemId && editingItemText.trim()) {
      onEditItem(editingItemId, editingItemText.trim())
    }
  }

  return (
    <div style={{
      backgroundColor: '#fafbfc',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      padding: '12px'
    }}>
      {/* ヘッダー */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <h4 style={{
          fontSize: '14px',
          fontWeight: '500',
          color: '#4b5563',
          margin: 0
        }}>
          {listWithItems.list.store_name}
        </h4>
        <button
          onClick={() => onDeleteList(listWithItems.list.id)}
          style={{
            padding: '4px 6px',
            fontSize: '12px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          削除
        </button>
      </div>

      {/* アイテムリスト */}
      <div style={{ marginBottom: '12px' }}>
        {listWithItems.items.map((item) => (
          <div key={item.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 0',
            borderBottom: '1px solid #f3f4f6'
          }}>
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => onToggleItem(item.id)}
              style={{ cursor: 'pointer' }}
            />

            {editingItemId === item.id ? (
              <input
                type="text"
                value={editingItemText}
                onChange={(e) => setEditingItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSubmit()
                  if (e.key === 'Escape') {
                    setEditingItemId(null)
                    setEditingItemText('')
                  }
                }}
                onBlur={handleEditSubmit}
                style={{
                  flex: 1,
                  padding: '2px 4px',
                  fontSize: '14px',
                  border: '1px solid #3b82f6',
                  borderRadius: '2px'
                }}
                autoFocus
              />
            ) : (
              <span
                onClick={() => startEditing(item.id, item.item_name)}
                style={{
                  flex: 1,
                  fontSize: '14px',
                  color: item.completed ? '#9ca3af' : '#374151',
                  textDecoration: item.completed ? 'line-through' : 'none',
                  cursor: 'pointer'
                }}
              >
                {item.item_name}
              </span>
            )}

            <button
              onClick={() => onDeleteItem(item.id)}
              style={{
                padding: '2px 4px',
                fontSize: '10px',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* 新しいアイテムを追加 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <input
          type="text"
          placeholder="買うものを追加"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddItemLocal()
          }}
          style={{
            flex: 1,
            padding: '6px 8px',
            fontSize: '14px',
            border: '1px solid #d1d5db',
            borderRadius: '4px'
          }}
        />
        <button
          onClick={handleAddItemLocal}
          disabled={!newItemName.trim()}
          style={{
            padding: '6px 12px',
            fontSize: '14px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: newItemName.trim() ? 'pointer' : 'not-allowed',
            opacity: newItemName.trim() ? 1 : 0.5
          }}
        >
          追加
        </button>
      </div>

      {/* スケジュール移動ボタン */}
      {listWithItems.incompleteItems.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => onScheduleToday(listWithItems)}
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            今日
          </button>
          <button
            onClick={() => onScheduleTomorrow(listWithItems)}
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            明日
          </button>
          <button
            onClick={() => onScheduleAfterTomorrow(listWithItems)}
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            明後日
          </button>
        </div>
      )}
    </div>
  )
}