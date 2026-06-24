'use client'

import { RevealGroup, RevealItem } from './reveal'
import { CountUp } from './count-up'

const stats = [
  { end: 24, suffix: 'h', label: 'Average approval time' },
  { end: 100, suffix: '%', label: 'Confidential handling' },
  { end: 2, suffix: '', label: 'Tailored loan products' },
  { end: 3, suffix: '+', label: 'Cities served in Zambia' },
]

export function Stats() {
  return (
    <section className="bg-gradient-to-r from-brand to-accent2 py-12 lg:py-16">
      <RevealGroup className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 lg:grid-cols-4 lg:px-8">
        {stats.map((s) => (
          <RevealItem key={s.label} className="text-center">
            <p className="font-heading text-4xl font-extrabold text-brand-foreground lg:text-5xl">
              <CountUp end={s.end} suffix={s.suffix} />
            </p>
            <p className="mt-2 text-sm font-medium text-brand-foreground/80">
              {s.label}
            </p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  )
}
