'use client'

import Image from 'next/image'
import { Target, Eye, HeartHandshake } from 'lucide-react'
import { Reveal, RevealGroup, RevealItem } from './reveal'

const values = [
  {
    icon: Target,
    title: 'Our Mission',
    text: 'To provide reliable and accessible financial solutions that empower our clients to overcome financial challenges and achieve their goals.',
  },
  {
    icon: Eye,
    title: 'Our Vision',
    text: 'To become a leading credit solutions provider known for trust, innovation, and exceptional customer service.',
  },
]

export function About() {
  return (
    <section id="about" className="bg-background py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:gap-20 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border shadow-xl">
            <Image
              src="/images/about.png"
              alt="Rutha Credit Solutions advisor explaining financing options to a couple"
              width={1200}
              height={800}
              className="h-full w-full object-cover"
            />
          </div>
        </Reveal>

        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
              <HeartHandshake className="h-3.5 w-3.5" />
              About Us
            </span>
            <h2 className="mt-5 text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              A financial partner built on integrity and trust
            </h2>
            <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
              Rutha Credit Solutions is a trusted financial services provider
              dedicated to offering flexible and accessible lending solutions to
              individuals and businesses. We specialize in quick, reliable and
              customer-focused credit services designed to meet urgent and
              everyday financial needs.
            </p>
          </Reveal>

          <RevealGroup className="mt-8 grid gap-5 sm:grid-cols-2">
            {values.map((v) => (
              <RevealItem
                key={v.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {v.text}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  )
}
