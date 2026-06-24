import { supabase } from './supabase'
import type { Profile, UserRole } from './types'

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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signUp(email: string, password: string, fullName: string, role: UserRole = 'client') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
    },
  })
  return { data, error }
}

export async function signOut() {
  await supabase.auth.signOut()
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