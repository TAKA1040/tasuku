'use client'

import { useState } from 'react'

// 買い物リスト抽出関数のテスト
const extractShoppingList = (memoText: string): { cleanMemo: string; shoppingItems: string[] } => {
  if (!memoText) return { cleanMemo: '', shoppingItems: [] }

  // 買い物リストのパターンを探す
  const shoppingListRegex = /【買い物リスト】\n((?:• .+(?:\n|$))+)/
  const match = memoText.match(shoppingListRegex)

  if (!match) {
    return { cleanMemo: memoText, shoppingItems: [] }
  }

  // 買い物アイテムを抽出
  const shoppingSection = match[1]
  const items = shoppingSection
    .split('\n')
    .map(line => line.replace(/^• /, '').trim())
    .filter(item => item.length > 0)

  // memoから買い物リスト部分を除去
  const cleanMemo = memoText
    .replace(/\n*【買い物リスト】\n(?:• .+(?:\n|$))+/, '')
    .trim()

  return { cleanMemo, shoppingItems: items }
}

export default function ShoppingTestPage() {
  const [testMemo, setTestMemo] = useState(`メモの内容

【買い物リスト】
• りんご
• バナナ
• 牛乳

追加のメモ`)

  const [shoppingItems, setShoppingItems] = useState<string[]>([])
  const [newItem, setNewItem] = useState('')

  const addItem = () => {
    if (newItem.trim()) {
      setShoppingItems([...shoppingItems, newItem.trim()])
      setNewItem('')
    }
  }

  const testExtraction = () => {
    const result = extractShoppingList(testMemo)
    console.log('抽出テスト結果:', result)
    setShoppingItems(result.shoppingItems)
    alert(`抽出結果:\nアイテム数: ${result.shoppingItems.length}\nアイテム: ${result.shoppingItems.join(', ')}\nクリーンメモ: ${result.cleanMemo}`)
  }

  const generateMemo = () => {
    let finalMemo = "基本のメモ内容"
    if (shoppingItems.length > 0) {
      const shoppingListText = '【買い物リスト】\n' + shoppingItems.map(item => `• ${item}`).join('\n')
      finalMemo = finalMemo ? `${finalMemo}\n\n${shoppingListText}` : shoppingListText
    }
    setTestMemo(finalMemo)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addItem()
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>買い物リスト機能テストページ</h1>

      <h2>1. memo抽出テスト</h2>
      <textarea
        value={testMemo}
        onChange={(e) => setTestMemo(e.target.value)}
        rows={10}
        cols={80}
        style={{ width: '100%', marginBottom: '10px' }}
      />
      <button onClick={testExtraction}>抽出テスト実行</button>

      <h2>2. 買い物リスト追加テスト</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="買い物アイテムを入力"
          style={{ flex: 1, padding: '5px' }}
        />
        <button onClick={addItem}>追加</button>
      </div>

      <h3>現在の買い物リスト ({shoppingItems.length}個):</h3>
      <ul>
        {shoppingItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <button onClick={generateMemo}>memo生成テスト</button>

      <h2>3. キー入力テスト</h2>
      <p>上の入力フィールドで以下をテスト:</p>
      <ul>
        <li>文字を最後まで入力できるか</li>
        <li>Enterキーで追加されるか</li>
        <li>追加ボタンで追加されるか</li>
      </ul>
    </div>
  )
}