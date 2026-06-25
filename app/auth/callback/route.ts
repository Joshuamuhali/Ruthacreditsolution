import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Exchange the verification code for active session
    const { data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (data.user) {
      // Fetch user profile to determine routing
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, kyc_status')
        .eq('id', data.user.id)
        .single()
      
      let redirectPath = '/dashboard'
      
      if (profile) {
        // Route based on role and KYC status
        if (profile.role === 'admin' || profile.role === 'loan_ops') {
          redirectPath = '/admin'
        } else if (profile.role === 'client') {
          // Client routing based on KYC status
          switch (profile.kyc_status) {
            case 'not_started':
            case 'in_progress':
            case 'rejected':
              redirectPath = '/kyc/onboarding'
              break
            case 'submitted':
            case 'under_review':
            case 'completed':
              redirectPath = '/dashboard'
              break
            default:
              redirectPath = '/kyc/onboarding'
          }
        }
      }
      
      return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
    }
  }

  // Fallback to dashboard
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
