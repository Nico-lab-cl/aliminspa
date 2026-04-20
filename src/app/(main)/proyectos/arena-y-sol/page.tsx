import type { Metadata } from 'next'
import { PROJECTS, SITE } from '@/lib/constants'
import { BreadcrumbSchema } from '@/components/seo/JsonLd'
import MetaTrackPageView from '@/components/analytics/MetaTrackPageView'
import styles from './ArenaYSol.module.css'

// Components
import AysHero from './components/AysHero'
import AysIntro from './components/AysIntro'
import AysGallery from './components/AysGallery'
import AysFeatures from './components/AysFeatures'
import AysFinancing from './components/AysFinancing'
import AysCTA from './components/AysCTA'
import AysFamilyCarousel from './components/AysFamilyCarousel'
import ContactForm from '@/components/sections/ContactForm'

const project = PROJECTS[1] // Arena y Sol

export const metadata: Metadata = {
    title: `${project.name} | Terrenos Urbanizados en El Tabo`,
    description: project.description,
    alternates: { canonical: `${SITE.url}/proyectos/${project.slug}` },
}

export default function ArenaYSolPage() {
    return (
        <div className={styles.aysPage}>
            <MetaTrackPageView 
                customData={{ 
                    content_name: project.name, 
                    content_category: 'Real Estate',
                    content_type: 'product' 
                }} 
            />
            <BreadcrumbSchema
                items={[
                    { name: 'Inicio', url: SITE.url },
                    { name: 'Proyectos', url: `${SITE.url}/proyectos` },
                    { name: project.name, url: `${SITE.url}/proyectos/${project.slug}` },
                ]}
            />
            
            <main>
                <AysHero />
                
                <AysIntro />
                
                <AysGallery />
                
                <AysFeatures />
                
                <AysFinancing />
                
                <AysFamilyCarousel />
                
                <AysCTA />
                
                <section className="bg-white py-20">
                    <div className="container">
                        <ContactForm />
                    </div>
                </section>
            </main>
        </div>
    )
}
