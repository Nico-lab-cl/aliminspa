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
import { PLANES_LOMAS_DEL_MAR } from '@/components/credito/planes'

// La calculadora de la home parte con el plan publicado de Lomas del Mar 200 m²
// (el mismo de su página), no con el ejemplo de la planilla ($38.490.000), que
// no es un precio real y los leads lo dejaban tal cual.
const PLAN_LOMAS_200 = PLANES_LOMAS_DEL_MAR[0].datos

export default function HomePage() {
    return (
        <>
            <FAQSchema />
            <Hero />
            <Benefits />
            <Projects />
            <SeccionCalculadora origen="Inicio" valoresIniciales={PLAN_LOMAS_200} />
            <StrategicLocation />
            <Testimonials />
            <NearbyPlaces />
            <HomeContactForm />
            <FAQ />
            <HomeNewsletter />
        </>
    )
}
