'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { ArrowRight, ShieldCheck, Clock, Sparkles } from 'lucide-react'
import { AuthLink } from '../auth-link'

const easing = [0.22, 1, 0.36, 1] as const

const badges = [
  { icon: Clock, label: 'Fast approvals' },
  { icon: ShieldCheck, label: 'Confidential & secure' },
  { icon: Sparkles, label: 'Flexible repayment' },
]

export function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-r from-brand to-accent2 pt-28 pb-16 lg:pt-36 lg:pb-24"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easing }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Trusted financial partner
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easing, delay: 0.08 }}
            className="mt-5 text-balance font-heading text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Flexible lending that moves at{' '}
            <span className="text-white/90">
              the speed of life
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easing, delay: 0.16 }}
            className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-white/80"
          >
            Rutha Credit Solutions provides quick, reliable and customer-focused
            credit services for individuals and businesses, helping you achieve
            financial stability and growth.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easing, delay: 0.24 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <AuthLink
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-brand shadow-lg shadow-black/20 transition-transform hover:scale-[1.03]"
            >
              Apply for a loan
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </AuthLink>
            <a
              href="#services"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/20"
            >
              Explore services
            </a>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.36 }}
            className="mt-9 flex flex-wrap gap-x-6 gap-y-3"
          >
            {badges.map((b) => (
              <li
                key={b.label}
                className="flex items-center gap-2 text-sm font-medium text-white/80"
              >
                <b.icon className="h-4 w-4 text-white" />
                {b.label}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easing, delay: 0.2 }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/20 shadow-2xl shadow-black/20">
            <Image
              src="/images/hero.png"
              alt="Rutha Credit Solutions advisor assisting a client in a modern office"
              width={1320}
              height={810}
              priority
              className="h-auto w-full object-cover"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-white/20 bg-white/10 px-5 py-4 shadow-xl backdrop-blur sm:block"
          >
            <p className="font-heading text-2xl font-bold text-white">24h</p>
            <p className="text-xs font-medium text-white/80">
              Typical approval window
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
