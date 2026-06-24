'use client'

import { motion } from 'framer-motion'
import { Phone, Mail, ArrowRight } from 'lucide-react'
import { Reveal } from './reveal'

const channels = [
  {
    icon: Phone,
    label: 'Call us',
    lines: ['+260 977 408230', '+260 966 408230', '+260 773 162468'],
    href: 'tel:+260773162468',
  },
  {
    icon: Mail,
    label: 'Email us',
    lines: ['kashempa@rutharcredit.com'],
    href: 'mailto:kashempa@rutharcredit.com',
  },
]

export function Contact() {
  return (
    <section id="contact" className="bg-secondary/40 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-accent2 p-8 text-center shadow-2xl shadow-brand/20 sm:p-14"
        >
          <h2 className="mx-auto max-w-2xl text-balance font-heading text-3xl font-bold tracking-tight text-brand-foreground sm:text-4xl">
            Ready to take the next step toward financial stability?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-brand-foreground/85">
            Talk to our team today and discover a loan facility built around
            your needs. Fast, fair and completely confidential.
          </p>
          <a
            href="tel:+260773162468"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-background px-7 py-3.5 text-sm font-semibold text-brand transition-transform hover:scale-[1.03]"
          >
            Speak to an advisor
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {channels.map((c, i) => (
            <Reveal key={c.label} delay={i * 0.08}>
              <a
                href={c.href}
                className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <c.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </p>
                <div className="mt-1 space-y-0.5">
                  {c.lines.map((line) => (
                    <p
                      key={line}
                      className="font-heading text-base font-semibold text-foreground"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
