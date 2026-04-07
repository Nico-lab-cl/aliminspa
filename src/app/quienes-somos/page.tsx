import { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Newsletter from '@/components/sections/Newsletter'
import { AuroraBackground } from './components/AuroraBackground'
import { HeroSection } from './components/HeroSection'
import { MisionVision } from './components/MisionVision'
import { DirectionSection } from './components/DirectionSection'
import { AdvisorsSection } from './components/AdvisorsSection'
import styles from './page.module.css'

export const metadata: Metadata = {
    title: 'Quiénes Somos - Nuestro Equipo',
    description: 'Conoce al equipo humano, profesional y comprometido detrás de Alimin Inmobiliaria. Dedicados a asegurar tu futuro en El Tabo, Litoral Central.',
}

export default function TeamPage() {
    return (
        <main className={styles.page}>
            <Navbar />
            <AuroraBackground>
                <HeroSection />
                <MisionVision />
                <DirectionSection />
                <AdvisorsSection />
            </AuroraBackground>
            <Newsletter />
            <Footer />
        </main>
    )
}
