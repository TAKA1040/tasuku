// PostgreSQL クライアント（manariedb用）
import { Pool, PoolClient, types } from 'pg'

// DATE型を文字列（YYYY-MM-DD）として返す設定
// pgドライバーはデフォルトでDateオブジェクトに変換するため、
// JSON化すると「2025-12-07T00:00:00.000Z」になってしまう
types.setTypeParser(types.builtins.DATE, (val: string) => val) // DATE → 文字列のまま
types.setTypeParser(types.builtins.TIMESTAMP, (val: string) => val) // TIMESTAMP → 文字列のまま
types.setTypeParser(types.builtins.TIMESTAMPTZ, (val: string) => val) // TIMESTAMPTZ → 文字列のまま

// 接続プール（サーバーサイドのみ）
let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set')
    }
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  }
  return pool
}

// クエリ実行ヘルパー
export async function query<T>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getPool()
  const result = await pool.query(text, params)
  return result.rows as T[]
}

// 単一行取得
export async function queryOne<T>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] || null
}

// トランザクション実行
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// 接続テスト
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query<{ version: string }>('SELECT version()')
    console.log('PostgreSQL connected:', result[0]?.version)
    return true
  } catch (error) {
    console.error('PostgreSQL connection failed:', error)
    return false
  }
}
