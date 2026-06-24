import { Phone, Mail } from 'lucide-react'
import { Logo } from './logo'

const nav = [
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Why Us', href: '#why-us' },
  { label: 'Contact', href: '#contact' },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo variant="footer" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              A trusted financial services provider offering flexible,
              accessible lending solutions to individuals and businesses across
              Zambia.
            </p>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
              Company
            </h3>
            <ul className="mt-4 space-y-2.5">
              {nav.map((n) => (
                <li key={n.href}>
                  <a
                    href={n.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-brand"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
              Contact
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand" />
                <a href="tel:+260773162468" className="hover:text-brand">
                  +260 773 162468
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand" />
                <a
                  href="mailto:kashempa@rutharcredit.com"
                  className="hover:text-brand"
                >
                  kashempa@rutharcredit.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} Rutha Credit Solutions. All rights
            reserved.
          </p>
          <p>Built on integrity, transparency and client satisfaction.</p>
        </div>
      </div>
    </footer>
  )
}
