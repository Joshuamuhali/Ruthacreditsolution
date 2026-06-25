import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

function ensureClient(): SupabaseClient {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables.\n' +
      'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
      'are set in your .env.local file or Vercel project settings.'
    )
  }

  client = createClient(supabaseUrl, supabaseAnonKey)
  return client
}

/**
 * Lazily-initialized Supabase client.
 *
 * The client is NOT created at module import time — it is only created
 * when a property (e.g. `.from()`, `.auth.getUser()`) is first accessed.
 * This prevents build/prerender failures caused by missing environment
 * variables during static generation on Vercel.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = ensureClient()
    return Reflect.get(c, prop)
  },
})