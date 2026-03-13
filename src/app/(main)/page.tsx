import Hero from '@/components/sections/Hero'
import Projects from '@/components/sections/Projects'
import Testimonials from '@/components/sections/Testimonials'
import Benefits from '@/components/sections/Benefits'
import Location from '@/components/sections/Location'
import ContactForm from '@/components/sections/ContactForm'
import FAQ from '@/components/sections/FAQ'
import Newsletter from '@/components/sections/Newsletter'
import { FAQSchema } from '@/components/seo/JsonLd'

export default function HomePage() {
  return (
    <>
      <FAQSchema />
      <Hero />
      <Projects />
      <Testimonials />
      <Benefits />
      <Location />
      <ContactForm />
      <FAQ />
      <Newsletter />
    </>
  )
}
