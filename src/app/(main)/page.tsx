import Hero from '@/components/sections/Hero'
import Benefits from '@/components/sections/Benefits'
import Projects from '@/components/sections/Projects'
import StrategicLocation from '@/components/sections/StrategicLocation'
import Testimonials from '@/components/sections/Testimonials'
import NearbyPlaces from '@/components/sections/NearbyPlaces'
import HomeContactForm from '@/components/sections/HomeContactForm'
import FAQ from '@/components/sections/FAQ'
import HomeNewsletter from '@/components/sections/HomeNewsletter'
import { FAQSchema } from '@/components/seo/JsonLd'
import SeccionCalculadora from '@/components/credito/SeccionCalculadora'

export default function HomePage() {
    return (
        <>
            <FAQSchema />
            <Hero />
            <Benefits />
            <Projects />
            <SeccionCalculadora origen="Inicio" />
            <StrategicLocation />
            <Testimonials />
            <NearbyPlaces />
            <HomeContactForm />
            <FAQ />
            <HomeNewsletter />
        </>
    )
}
