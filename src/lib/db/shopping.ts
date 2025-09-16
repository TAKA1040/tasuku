// Shopping List CRUD Operations
// 買い物リストの作成、読み取り、更新、削除機能

import { db as database, STORE_NAMES } from './database'
import type { ShoppingList, ShoppingItem } from './schema'
import { generateId } from '../utils/id-generator'

export class ShoppingListService {
  // 買い物リストを作成
  async createShoppingList(storeName: string): Promise<ShoppingList> {
    await database.init()

    const shoppingList: ShoppingList = {
      id: generateId(),
      store_name: storeName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await database.put(STORE_NAMES.SHOPPING_LISTS, shoppingList)
    return shoppingList
  }

  // すべての買い物リストを取得
  async getAllShoppingLists(): Promise<ShoppingList[]> {
    await database.init()
    const lists = await database.getAll<ShoppingList>(STORE_NAMES.SHOPPING_LISTS)
    // 作成日時順にソート（新しい順）
    return lists.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  // 買い物リストを削除
  async deleteShoppingList(listId: string): Promise<void> {
    await database.init()

    // 関連する買い物アイテムもすべて削除
    const itemService = new ShoppingItemService()
    const items = await itemService.getShoppingItems(listId)
    for (const item of items) {
      await database.delete(STORE_NAMES.SHOPPING_ITEMS, item.id)
    }

    // 買い物リストを削除
    await database.delete(STORE_NAMES.SHOPPING_LISTS, listId)
  }

  // 買い物リストの店舗名を更新
  async updateShoppingListName(listId: string, storeName: string): Promise<void> {
    await database.init()

    const shoppingList = await database.get<ShoppingList>(STORE_NAMES.SHOPPING_LISTS, listId)
    if (!shoppingList) {
      throw new Error('Shopping list not found')
    }

    shoppingList.store_name = storeName
    shoppingList.updated_at = new Date().toISOString()
    await database.put(STORE_NAMES.SHOPPING_LISTS, shoppingList)
  }
}

export class ShoppingItemService {
  // 買い物アイテムを追加
  async addShoppingItem(listId: string, itemName: string, sortOrder?: number): Promise<ShoppingItem> {
    await database.init()

    // 並び順が指定されていない場合、最後に追加
    if (sortOrder === undefined) {
      const existingItems = await this.getShoppingItems(listId)
      sortOrder = existingItems.length
    }

    const shoppingItem: ShoppingItem = {
      id: generateId(),
      shopping_list_id: listId,
      item_name: itemName,
      completed: false,
      sort_order: sortOrder,
      created_at: new Date().toISOString()
    }

    await database.put(STORE_NAMES.SHOPPING_ITEMS, shoppingItem)

    // 親リストの更新日時を更新
    await this.updateShoppingListTimestamp(listId)

    return shoppingItem
  }

  // 買い物リストのアイテムを取得
  async getShoppingItems(listId: string): Promise<ShoppingItem[]> {
    await database.init()
    const items = await database.getByIndex<ShoppingItem>(
      STORE_NAMES.SHOPPING_ITEMS,
      'by_shopping_list_id',
      listId
    )
    // 並び順でソート
    return items.sort((a, b) => a.sort_order - b.sort_order)
  }

  // 買い物アイテムの完了状態を切り替え
  async toggleShoppingItemCompletion(itemId: string): Promise<void> {
    await database.init()

    const item = await database.get<ShoppingItem>(STORE_NAMES.SHOPPING_ITEMS, itemId)
    if (!item) {
      throw new Error('Shopping item not found')
    }

    item.completed = !item.completed
    await database.put(STORE_NAMES.SHOPPING_ITEMS, item)

    // 親リストの更新日時を更新
    await this.updateShoppingListTimestamp(item.shopping_list_id)
  }

  // 買い物アイテムの名前を更新
  async updateShoppingItemName(itemId: string, itemName: string): Promise<void> {
    await database.init()

    const item = await database.get<ShoppingItem>(STORE_NAMES.SHOPPING_ITEMS, itemId)
    if (!item) {
      throw new Error('Shopping item not found')
    }

    item.item_name = itemName
    await database.put(STORE_NAMES.SHOPPING_ITEMS, item)

    // 親リストの更新日時を更新
    await this.updateShoppingListTimestamp(item.shopping_list_id)
  }

  // 買い物アイテムを削除
  async deleteShoppingItem(itemId: string): Promise<void> {
    await database.init()

    const item = await database.get<ShoppingItem>(STORE_NAMES.SHOPPING_ITEMS, itemId)
    if (!item) {
      throw new Error('Shopping item not found')
    }

    const listId = item.shopping_list_id
    await database.delete(STORE_NAMES.SHOPPING_ITEMS, itemId)

    // 親リストの更新日時を更新
    await this.updateShoppingListTimestamp(listId)
  }

  // 未完了の買い物アイテムを取得
  async getIncompleteShoppingItems(listId: string): Promise<ShoppingItem[]> {
    await database.init()
    const allItems = await this.getShoppingItems(listId)
    return allItems.filter(item => !item.completed)
  }

  // 完了済みの買い物アイテムを取得
  async getCompletedShoppingItems(listId: string): Promise<ShoppingItem[]> {
    await database.init()
    const allItems = await this.getShoppingItems(listId)
    return allItems.filter(item => item.completed)
  }

  // 買い物リストの完了率を計算
  async getCompletionRate(listId: string): Promise<number> {
    await database.init()
    const allItems = await this.getShoppingItems(listId)

    if (allItems.length === 0) return 0

    const completedCount = allItems.filter(item => item.completed).length
    return Math.round((completedCount / allItems.length) * 100)
  }

  // 買い物リストの更新日時を更新（プライベートヘルパー）
  private async updateShoppingListTimestamp(listId: string): Promise<void> {
    const shoppingList = await database.get<ShoppingList>(STORE_NAMES.SHOPPING_LISTS, listId)
    if (shoppingList) {
      shoppingList.updated_at = new Date().toISOString()
      await database.put(STORE_NAMES.SHOPPING_LISTS, shoppingList)
    }
  }
}

// 買い物リストとアイテムの統合データ型
export interface ShoppingListWithItems {
  list: ShoppingList
  items: ShoppingItem[]
  incompleteItems: ShoppingItem[]
  completionRate: number
}

export class ShoppingService {
  private listService = new ShoppingListService()
  private itemService = new ShoppingItemService()

  // 買い物リストとアイテムを一括取得
  async getShoppingListWithItems(listId: string): Promise<ShoppingListWithItems | null> {
    await database.init()

    const list = await database.get<ShoppingList>(STORE_NAMES.SHOPPING_LISTS, listId)
    if (!list) return null

    const items = await this.itemService.getShoppingItems(listId)
    const incompleteItems = items.filter(item => !item.completed)
    const completionRate = await this.itemService.getCompletionRate(listId)

    return {
      list,
      items,
      incompleteItems,
      completionRate
    }
  }

  // すべての買い物リストとアイテムを取得
  async getAllShoppingListsWithItems(): Promise<ShoppingListWithItems[]> {
    await database.init()

    const lists = await this.listService.getAllShoppingLists()
    const results: ShoppingListWithItems[] = []

    for (const list of lists) {
      const items = await this.itemService.getShoppingItems(list.id)
      const incompleteItems = items.filter(item => !item.completed)
      const completionRate = await this.itemService.getCompletionRate(list.id)

      results.push({
        list,
        items,
        incompleteItems,
        completionRate
      })
    }

    return results
  }

  // アクセサーメソッド
  get lists() { return this.listService }
  get items() { return this.itemService }
}

// シングルトンインスタンス
export const shoppingService = new ShoppingService()
export const shoppingListService = new ShoppingListService()
export const shoppingItemService = new ShoppingItemService()