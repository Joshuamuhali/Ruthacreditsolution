'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Banknote, Car, Check, ArrowRight } from 'lucide-react'
import { Reveal } from './reveal'

const services = [
  {
    id: 'soft-loans',
    icon: Banknote,
    eyebrow: 'Service 01',
    title: 'Soft Loans',
    image: '/images/soft-loans.png',
    description:
      'Immediate financial relief for personal or business needs — emergencies, small business capital, school fees, rent or medical bills.',
    points: [
      'Fast approval, often within a short timeframe',
      'Minimal paperwork, making it easy to apply',
      'Flexible repayment plans that suit your income flow',
      'Competitive and fair interest rates',
      'Client-focused assessments for manageable amounts',
    ],
  },
  {
    id: 'car-loans',
    icon: Car,
    eyebrow: 'Service 02',
    title: 'Car White Book Loans',
    image: '/images/car-loans.png',
    description:
      'Access larger funds using your vehicle as collateral — without giving up the use of your car. Ideal for business owners and transport operators.',
    points: [
      'Quick valuation and approval process',
      'Higher loan amounts based on your vehicle’s value',
      'Continued use of your vehicle while repaying',
      'Secure, confidential handling of documents',
      'Flexible repayment options for your situation',
    ],
  },
]

export function Services() {
  return (
    <section id="services" className="bg-secondary/40 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
            What We Offer
          </span>
          <h2 className="mt-5 text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Lending solutions tailored to your goals
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Whether you need quick relief or larger capital, we design every
            facility around your repayment ability and financial wellbeing.
          </p>
        </Reveal>

        <div className="mt-16 flex flex-col gap-12 lg:gap-20">
          {services.map((service, i) => (
            <div
              key={service.id}
              id={service.id}
              className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
            >
              <motion.div
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={i % 2 === 1 ? 'lg:order-2' : ''}
              >
                <div className="relative overflow-hidden rounded-3xl border border-border shadow-xl">
                  <Image
                    src={service.image}
                    alt={`${service.title} from Rutha Credit Solutions`}
                    width={1200}
                    height={800}
                    className="h-full w-full object-cover"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: i % 2 === 0 ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                className={i % 2 === 1 ? 'lg:order-1' : ''}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <service.icon className="h-6 w-6" />
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-brand">
                  {service.eyebrow}
                </p>
                <h3 className="mt-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">
                  {service.title}
                </h3>
                <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
                  {service.description}
                </p>

                <ul className="mt-6 space-y-3">
                  {service.points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand/10 text-brand">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-sm leading-relaxed text-foreground/80">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#contact"
                  className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand"
                >
                  Apply for this loan
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
