'use client'

import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth'
import {
  LayoutDashboard,
  ClipboardList,
  Landmark,
  Wallet,
  BarChart3,
  Shield,
  Users,
  LogOut,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/types'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

const adminNav: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/applications', label: 'Applications', icon: ClipboardList },
  { href: '/admin/loans', label: 'Loans', icon: Landmark },
  { href: '/admin/disbursements', label: 'Disbursements', icon: Wallet },
  { href: '/admin/repayments', label: 'Repayments', icon: Wallet },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/audit', label: 'Audit Log', icon: Shield },
  { href: '/admin/users', label: 'Users', icon: Users },
]

const opsNav: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/applications', label: 'Applications', icon: ClipboardList },
  { href: '/admin/loans', label: 'Loans', icon: Landmark },
  { href: '/admin/disbursements', label: 'Disbursements', icon: Wallet },
  { href: '/admin/repayments', label: 'Repayments', icon: Wallet },
]

type SidebarProps = {
  role: UserRole
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const items = role === 'admin' ? adminNav : opsNav

  async function handleSignOut() {
    await signOut()
    router.push('/auth')
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[#1F2937] bg-[#111827]">
      <div className="flex items-center gap-2 border-b border-[#1F2937] px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6D28D9]">
          <span className="text-sm font-bold text-white">R</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#F9FAFB]">Rutha LMS</p>
          <p className="text-[10px] text-[#9CA3AF]">Loan Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#6D28D9]/10 text-[#6D28D9]'
                  : 'text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          )
        })}
      </nav>

      <div className="border-t border-[#1F2937] p-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#9CA3AF] transition-colors hover:bg-[#1F2937] hover:text-[#F9FAFB]"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
        <a
          href="/"
          className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#9CA3AF] transition-colors hover:bg-[#1F2937] hover:text-[#F9FAFB]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Website
        </a>
      </div>
    </aside>
  )
}