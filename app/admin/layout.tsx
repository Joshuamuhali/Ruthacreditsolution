import type { ReactNode } from 'react'

export const metadata = {
  title: 'Rutha LMS | Admin',
  description: 'Rutha Credit Solutions - Loan Management System',
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}