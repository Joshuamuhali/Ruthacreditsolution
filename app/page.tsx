import { Navbar } from '@/components/site/navbar'
import { Hero } from '@/components/site/hero'
import { About } from '@/components/site/about'
import { Stats } from '@/components/site/stats'
import { Services } from '@/components/site/services'
import { WhyUs } from '@/components/site/why-us'
import { Contact } from '@/components/site/contact'
import { Footer } from '@/components/site/footer'

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <About />
      <Stats />
      <Services />
      <WhyUs />
      <Contact />
      <Footer />
    </main>
  )
}
