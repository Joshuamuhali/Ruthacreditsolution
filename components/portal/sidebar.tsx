'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  HandCoins,
  Wallet,
  CreditCard,
  Bell,
  User,
  X,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/apply', label: 'Apply for Loan', icon: HandCoins },
  { href: '/dashboard/loans', label: 'My Loans', icon: Wallet },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
]

type SidebarProps = {
  open: boolean
  onClose: () => void
}

export function PortalSidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-[#1F2937] bg-[#0B0F1A] transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-[#1F2937] px-5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6D28D9]">
              <span className="text-sm font-bold text-white">R</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#F9FAFB]">Rutha Credit</p>
              <p className="text-[10px] text-[#9CA3AF]">Applicant Portal</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#F9FAFB] lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#6D28D9]/10 text-[#6D28D9]'
                    : 'text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-[#1F2937] px-5 py-4">
          <p className="text-xs text-[#6B7280]">Rutha Credit Solutions</p>
          <p className="text-[10px] text-[#4B5563]">v1.0.0</p>
        </div>
      </aside>
    </>
  )
}