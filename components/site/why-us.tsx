'use client'

import Image from 'next/image'
import { Zap, SlidersHorizontal, Lock, UserCheck, Users } from 'lucide-react'
import { Reveal, RevealGroup, RevealItem } from './reveal'

const reasons = [
  {
    icon: Zap,
    title: 'Fast Processing',
    text: 'Quick approval and disbursement of funds when you need them most.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Flexible Terms',
    text: 'Tailored repayment plans built to suit your income and needs.',
  },
  {
    icon: Lock,
    title: 'Trusted & Confidential',
    text: 'Your financial information is handled with the utmost privacy.',
  },
  {
    icon: UserCheck,
    title: 'Customer-Centered',
    text: 'We prioritise your financial wellbeing at every step.',
  },
  {
    icon: Users,
    title: 'Accessible Solutions',
    text: 'Designed for both individuals and small businesses alike.',
  },
]

export function WhyUs() {
  return (
    <section id="why-us" className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                Why Choose Us
              </span>
              <h2 className="mt-5 text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                The reasons clients keep coming back
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
                We build lasting relationships through transparency, speed and
                genuine care for your financial growth.
              </p>
            </Reveal>

            <RevealGroup className="mt-8 grid gap-4 sm:grid-cols-2">
              {reasons.map((r) => (
                <RevealItem
                  key={r.title}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <r.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
                    {r.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {r.text}
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>

          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-3xl border border-border shadow-xl">
              <Image
                src="/images/team.png"
                alt="The Rutha Credit Solutions team collaborating in a modern office"
                width={1200}
                height={900}
                className="h-full w-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
