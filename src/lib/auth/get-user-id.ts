// APIルート用の認証ヘルパー
// NextAuthのセッションからuser_idを取得

import { auth } from '@/auth'

export async function getUserId(): Promise<string | null> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return null
    }
    return session.user.id
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
