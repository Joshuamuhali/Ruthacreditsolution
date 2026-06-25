'use client'

import { useAuthAction } from '@/hooks/useAuthAction'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface ApplyButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'small' | 'medium' | 'large'
  className?: string
  children?: React.ReactNode
  redirectTo?: string
}

export function ApplyButton({ 
  variant = 'primary', 
  size = 'medium', 
  className = '',
  children = 'Apply Now',
  redirectTo = '/dashboard/apply'
}: ApplyButtonProps) {
  const router = useRouter()
  const { executeProtectedAction, isLoading } = useAuthAction()

  const handleClick = async () => {
    await executeProtectedAction(() => {
      router.push(redirectTo)
    })
  }

  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-[#6D28D9] to-[#5B21B6] text-white shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 hover:-translate-y-0.5',
    secondary: 'bg-[#111827] text-white border border-[#1F2937] hover:bg-[#1F2937]',
    outline: 'bg-transparent text-[#6D28D9] border-2 border-[#6D28D9] hover:bg-[#6D28D9]/10',
  }

  const sizeStyles = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-sm',
    large: 'px-8 py-4 text-base',
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking session...
        </>
      ) : (
        children
      )}
    </button>
  )
}
