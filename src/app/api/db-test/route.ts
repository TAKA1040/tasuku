import { NextResponse } from 'next/server'
import { testConnection, query } from '@/lib/db/postgres-client'

// DB接続テスト - 本番環境では無効
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'This endpoint is disabled in production' }, { status: 403 })
  }

  try {
    // 接続テスト
    const connected = await testConnection()

    if (!connected) {
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to PostgreSQL'
      }, { status: 500 })
    }

    // テーブルのレコード数を取得
    const tables = ['unified_tasks', 'recurring_templates', 'subtasks', 'done', 'fuel_records', 'user_metadata']
    const counts: Record<string, number> = {}

    for (const table of tables) {
      const result = await query<{ count: string }>(`SELECT COUNT(*) as count FROM ${table}`)
      counts[table] = parseInt(result[0]?.count || '0')
    }

    return NextResponse.json({
      success: true,
      database: 'manariedb',
      schema: 'tasuku_5f7d',
      tables: counts
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
