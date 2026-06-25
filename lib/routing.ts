import { supabase } from './supabase'
import type { Profile } from './types'

/**
 * Helper function to handle auth-aware navigation
 * Checks if user is authenticated and routes accordingly
 */
export async function handleAuthRoute(): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return '/auth'
    }

    // User is authenticated, get their profile to determine redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('kyc_status, role')
      .eq('id', user.id)
      .single()

    if (profile) {
      if (profile.role === 'admin' || profile.role === 'loan_ops') {
        return '/admin'
      } else if (profile.kyc_status === 'completed') {
        return '/dashboard/apply'
      } else {
        return '/kyc/onboarding'
      }
    }

    return '/auth'
  } catch (error) {
    console.error('Auth route error:', error)
    return '/auth'
  }
}

/**
 * Component that handles navigation with auth check
 */
export function useAuthNavigation() {
  const navigate = async (callback?: () => void) => {
    const route = await handleAuthRoute()
    callback?.()
    // Use window.location for immediate navigation
    window.location.href = route
  }

  return { navigate }
}
