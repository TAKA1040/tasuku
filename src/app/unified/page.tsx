'use client'

import { useDatabase } from '@/hooks/useDatabase'
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks'

export default function UnifiedTasksPage() {
  const { isInitialized, error: dbError } = useDatabase()
  const { tasks, loading, error: taskError } = useUnifiedTasks(isInitialized)

  if (dbError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">統一タスク管理</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          データベース接続エラー: {dbError}
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">統一タスク管理</h1>
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
          <span>データベース初期化中...</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">統一タスク管理</h1>
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
          <span>タスク読み込み中...</span>
        </div>
      </div>
    )
  }

  if (taskError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">統一タスク管理</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          タスク読み込みエラー: {taskError}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">統一タスク管理</h1>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          統一タスク数: {tasks.length}件
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-3 rounded">
          タスクがありません
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      {task.display_number}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {task.task_type}
                    </span>
                    {task.completed && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        完了
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium mt-2">{task.title}</h3>
                  {task.memo && (
                    <p className="text-sm text-gray-600 mt-1">{task.memo}</p>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    作成: {new Date(task.created_at).toLocaleString('ja-JP')}
                    {task.due_date && (
                      <span className="ml-3">
                        期限: {task.due_date}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}