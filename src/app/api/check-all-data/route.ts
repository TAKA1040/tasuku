import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // service_roleでRLSを無視して全データを取得
    const results = {
      timestamp: new Date().toISOString(),
      allData: {} as any
    }

    // 各テーブルの全データを確認（RLS無視）
    const tables = ['tasks', 'recurring_tasks', 'unified_tasks', 'subtasks', 'ideas']

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .limit(100)

        results.allData[table] = {
          success: !error,
          count: count || 0,
          sample: data ? data.slice(0, 3) : null,
          error: error?.message || null
        }
      } catch (err) {
        results.allData[table] = {
          success: false,
          error: `Exception: ${err}`
        }
      }
    }

    // auth.usersも確認（可能であれば）
    try {
      const { data: users } = await supabase.auth.admin.listUsers()
      results.allData.auth_users = {
        count: users?.users?.length || 0,
        sample_emails: users?.users?.slice(0, 3).map(u => u.email) || []
      }
    } catch (err) {
      results.allData.auth_users = {
        error: `Cannot access: ${err}`
      }
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Check all data failed', details: error },
      { status: 500 }
    )
  }
}