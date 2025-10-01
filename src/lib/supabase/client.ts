import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. Please check .env.local file:\n' +
      `- NEXT_PUBLIC_SUPABASE_URL: ${url ? 'OK' : 'MISSING'}\n` +
      `- NEXT_PUBLIC_SUPABASE_ANON_KEY: ${key ? 'OK' : 'MISSING'}`
    )
  }

  return createBrowserClient(url, key)
}