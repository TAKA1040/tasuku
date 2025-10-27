'use client'

import Link from 'next/link'

const toolItems = [
  {
    href: '/tools/nenpi',
    title: '⛽ 燃費記録',
    description: '給油記録の管理・燃費分析',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    hoverColor: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800'
  }
  // 将来的にここに追加
  // {
  //   href: '/tools/expenses',
  //   title: '💰 家計簿',
  //   description: '支出管理・予算追跡',
  //   bgColor: 'bg-green-50 dark:bg-green-900/20',
  //   hoverColor: 'hover:bg-green-100 dark:hover:bg-green-900/30',
  //   borderColor: 'border-green-200 dark:border-green-800'
  // },
]

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🛠️ ツール
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            便利なミニツール集
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {toolItems.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className={`block p-6 rounded-lg border-2 transition-all ${tool.bgColor} ${tool.hoverColor} ${tool.borderColor}`}
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {tool.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>

        {toolItems.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            ツールはまだ追加されていません
          </div>
        )}
      </div>
    </div>
  )
}
