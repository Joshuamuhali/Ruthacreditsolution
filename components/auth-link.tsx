'use client'

import { useState } from 'react'
import { handleAuthRoute } from '@/lib/routing'

interface AuthLinkProps {
  href?: string
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  className?: string
  children: React.ReactNode
}

/**
 * Link component that validates auth before navigating
 * If user is authenticated, routes to loan application
 * If not authenticated, routes to /auth
 */
export function AuthLink({ href, className, children, ...props }: AuthLinkProps) {
  const [isNavigating, setIsNavigating] = useState(false)

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    if (isNavigating) return

    setIsNavigating(true)
    try {
      const route = await handleAuthRoute()
      window.location.href = route
    } finally {
      setIsNavigating(false)
    }
  }

  return (
    <a
      href="javascript:void(0)"
      onClick={handleClick}
      className={className}
      style={{ pointerEvents: isNavigating ? 'none' : 'auto', opacity: isNavigating ? 0.6 : 1 }}
      {...props}
    >
      {children}
    </a>
  )
}
