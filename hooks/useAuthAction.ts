'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Rate limiter configuration
const RATE_LIMIT_WINDOW = 10000 // 10 seconds
const MAX_REQUESTS_PER_WINDOW = 3

// Validation helpers
function validateEmail(email: string): string | null {
  if (!email.trim()) {
    return 'Email address is required'
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address'
  }
  return null
}

function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required'
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters'
  }
  return null
}

function validateFullName(fullName: string): string | null {
  if (!fullName.trim()) {
    return 'Full name is required'
  }
  if (fullName.trim().length < 2) {
    return 'Full name must be at least 2 characters'
  }
  return null
}

function getFriendlyErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred'
  
  const message = error.message || String(error)
  
  // Network errors
  if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.'
  }
  
  // Supabase specific errors
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please try again.'
  }
  if (message.includes('Email not confirmed')) {
    return 'Please confirm your email address before signing in. Check your inbox for the confirmation link.'
  }
  if (message.includes('User already registered')) {
    return 'An account with this email already exists. Please sign in instead.'
  }
  if (message.includes('Password should be at least')) {
    return 'Password is too weak. Please use at least 6 characters.'
  }
  if (message.includes('signup is disabled')) {
    return 'Registration is currently disabled. Please contact support.'
  }
  if (message.includes('Too many requests') || message.includes('Rate limit')) {
    return 'Too many attempts. Please wait a moment before trying again.'
  }
  
  // Generic fallback
  return message || 'Authentication failed. Please try again.'
}

export function useAuthAction() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const requestTimestamps = useRef<number[]>([])
  const pendingAuthRef = useRef<Promise<any> | null>(null)

  // Rate limiter check
  const checkRateLimit = useCallback(() => {
    const now = Date.now()
    // Remove timestamps outside the window
    requestTimestamps.current = requestTimestamps.current.filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW
    )
    
    if (requestTimestamps.current.length >= MAX_REQUESTS_PER_WINDOW) {
      const oldestTimestamp = requestTimestamps.current[0]
      const waitTime = RATE_LIMIT_WINDOW - (now - oldestTimestamp)
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`)
    }
    
    requestTimestamps.current.push(now)
  }, [])

  // Get current user session without making new requests
  const getCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }, [])

  // Execute a protected action (only runs if authenticated)
  const executeProtectedAction = useCallback(async (
    protectedAction: () => Promise<void> | void,
    fallbackRedirect: string = '/auth'
  ) => {
    if (isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const user = await getCurrentUser()
      
      if (!user) {
        // Save intended destination for post-login redirect
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('redirect_after_login', window.location.pathname)
        }
        router.push(fallbackRedirect)
        return
      }

      // User is authenticated, execute the protected action
      if (protectedAction) {
        await protectedAction()
      }
    } catch (err) {
      const message = getFriendlyErrorMessage(err)
      setError(message)
      console.error('Protected action error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, getCurrentUser, router])

  // Sign in with rate limiting and deduplication
  const signIn = useCallback(async (email: string, password: string) => {
    // Client-side validation
    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return { data: null, error: { message: emailError } }
    }
    
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return { data: null, error: { message: passwordError } }
    }

    // If there's already a pending auth request, return it
    if (pendingAuthRef.current) {
      return pendingAuthRef.current
    }

    const authPromise = (async () => {
      try {
        checkRateLimit()
        
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        
        if (error) throw error
        
        // Check for saved redirect
        const savedRedirect = typeof window !== 'undefined' 
          ? sessionStorage.getItem('redirect_after_login') 
          : null
        
        if (savedRedirect) {
          sessionStorage.removeItem('redirect_after_login')
          router.push(savedRedirect)
        } else {
          router.push('/dashboard')
        }
        
        router.refresh()
        
        return { data, error: null }
      } catch (error: any) {
        const message = getFriendlyErrorMessage(error)
        setError(message)
        return { data: null, error: { message } }
      } finally {
        pendingAuthRef.current = null
      }
    })()

    pendingAuthRef.current = authPromise
    return authPromise
  }, [checkRateLimit, router])

  // Sign up with rate limiting and deduplication
  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    // Client-side validation
    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return { data: null, error: { message: emailError } }
    }
    
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return { data: null, error: { message: passwordError } }
    }
    
    const nameError = validateFullName(fullName)
    if (nameError) {
      setError(nameError)
      return { data: null, error: { message: nameError } }
    }

    if (pendingAuthRef.current) {
      return pendingAuthRef.current
    }

    const authPromise = (async () => {
      try {
        checkRateLimit()
        
        const origin = typeof window !== 'undefined' 
          ? window.location.origin 
          : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role: 'client' },
            emailRedirectTo: `${origin}/auth/callback`,
          },
        })
        
        if (error) throw error
        
        return { data, error: null }
      } catch (error: any) {
        const message = getFriendlyErrorMessage(error)
        setError(message)
        return { data: null, error: { message } }
      } finally {
        pendingAuthRef.current = null
      }
    })()

    pendingAuthRef.current = authPromise
    return authPromise
  }, [checkRateLimit])

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    executeProtectedAction,
    signIn,
    signUp,
    resetError,
  }
}
