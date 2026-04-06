import Hero from '@/components/sections/Hero'
import Benefits from '@/components/sections/Benefits'
import Testimonials from '@/components/sections/Testimonials'
import Steps from '@/components/sections/Steps'
import StrategicLocation from '@/components/sections/StrategicLocation'
import Projects from '@/components/sections/Projects'
import ContactForm from '@/components/sections/ContactForm'
import FAQAndMap from '@/components/sections/FAQAndMap'
import Newsletter from '@/components/sections/Newsletter'
import { FAQSchema } from '@/components/seo/JsonLd'

export default function HomePage() {
  return (
    <>
      <FAQSchema />
      <Hero />
      <Benefits />
      <Testimonials />
      <Steps />
      <StrategicLocation />
      <Projects />
      <ContactForm />
      <FAQAndMap />
      <Newsletter />
    </>
  )
}
