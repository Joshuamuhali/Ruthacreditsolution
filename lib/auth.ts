import { supabase } from './supabase'
import type { Profile, UserRole } from './types'

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 10000 // 10 seconds
const MAX_REQUESTS_PER_WINDOW = 3
const requestTimestamps: number[] = []

// Rate limiter check
function checkRateLimit() {
  const now = Date.now()
  // Remove timestamps outside the window
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > RATE_LIMIT_WINDOW) {
    requestTimestamps.shift()
  }
  
  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestTimestamp = requestTimestamps[0]
    const waitTime = RATE_LIMIT_WINDOW - (now - oldestTimestamp)
    throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`)
  }
  
  requestTimestamps.push(now)
}

// Exponential backoff retry for rate limits
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      checkRateLimit()
      return await fn()
    } catch (error: any) {
      // Only retry on 429 (Too Many Requests)
      if (error?.status === 429 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        throw error
      }
    }
  }
  throw new Error('Max retries exceeded')
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}

export async function signIn(email: string, password: string) {
  return retryWithBackoff(() =>
    supabase.auth.signInWithPassword({ email, password })
  )
}

export async function signUp(email: string, password: string, fullName: string, role: UserRole = 'client') {
  const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return retryWithBackoff(() =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })
  )
}

export async function signOut() {
  await supabase.auth.signOut()
}

// Helper to check if user is authenticated and get their profile
export async function checkAuthAndGetProfile(): Promise<{ isAuthenticated: boolean; profile: Profile | null; user: any } | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { isAuthenticated: false, profile: null, user: null }

    const profile = await getCurrentProfile()
    return { isAuthenticated: true, profile, user }
  } catch (error) {
    console.error('Auth check error:', error)
    return null
  }
}

export function getRedirectPath(role: UserRole): string {
  switch (role) {
    case 'admin': return '/admin'
    case 'loan_ops': return '/admin'
    case 'client': return '/portal'
    default: return '/auth'
  }
}

export async function createAuditLog(
  userId: string,
  userName: string,
  action: string,
  entity: string,
  entityId: string,
  details: Record<string, unknown> = {}
) {
  const { error } = await supabase.from('audit_logs').insert({
    user_id: userId,
    user_name: userName,
    action,
    entity,
    entity_id: entityId,
    details,
  })
  if (error) console.error('Audit log error:', error)
}