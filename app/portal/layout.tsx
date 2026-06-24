import type { ReactNode } from 'react'

export const metadata = {
  title: 'Rutha LMS | Client Portal',
  description: 'Rutha Credit Solutions - Client Portal',
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}