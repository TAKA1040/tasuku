import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // ユーザー認証状況確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // 全テーブル一覧を取得
    const { data: tableList, error: tableListError } = await supabase
      .rpc('get_table_list')
      .select()

    // テーブルが存在しない場合は直接確認
    const tables = ['tasks', 'recurring_tasks', 'recurring_logs', 'unified_tasks', 'subtasks', 'ideas', 'settings']
    const tableInfo = []

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        // データサンプルも取得
        let sampleData = null
        if (!error && count && count > 0) {
          const { data: sample } = await supabase
            .from(table)
            .select('*')
            .limit(3)
          sampleData = sample
        }

        tableInfo.push({
          table,
          count: error ? `Error: ${error.message}` : count,
          accessible: !error,
          sampleData: sampleData
        })
      } catch (err) {
        tableInfo.push({
          table,
          count: `Exception: ${err}`,
          accessible: false,
          sampleData: null
        })
      }
    }

    // ユーザー数も確認
    let userCount = null
    try {
      const { count } = await supabase
        .from('auth.users')
        .select('*', { count: 'exact', head: true })
      userCount = count
    } catch (err) {
      // auth.usersに直接アクセスできない場合
      userCount = 'No access to auth.users'
    }

    // スキーマ情報を取得（可能な場合）
    let schemaInfo = null
    try {
      const { data, error } = await supabase
        .rpc('get_schema_info')
      schemaInfo = error ? `Error: ${error.message}` : data
    } catch (err) {
      schemaInfo = 'Schema info not available'
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      } : null,
      authError: authError?.message || null,
      userCount,
      tables: tableInfo,
      tableList: tableListError ? `Error: ${tableListError.message}` : tableList,
      schemaInfo
    })
  } catch (error) {
    console.error('Debug DB error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: error },
      { status: 500 }
    )
  }
}