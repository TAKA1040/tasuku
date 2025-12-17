// APIルート用の認証ヘルパー
// Supabaseの認証からuser_idを取得

import { createClient } from '@/lib/supabase/server'

export async function getUserId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user.id
  } catch {
    return null
  }
}

export async function requireUserId(): Promise<string> {
  const userId = await getUserId()
  if (!userId) {
    throw new Error('Unauthorized: User not authenticated')
  }
  return userId
}
