import { SITE, FAQ_ITEMS } from '@/lib/constants'

export function RealEstateAgentSchema() {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: SITE.name,
        url: SITE.url,
        logo: `${SITE.url}/images/logo-alimin.png`,
        description: SITE.description,
        telephone: SITE.phone,
        email: SITE.email,
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'El Tabo',
            addressRegion: 'Valparaíso',
            addressCountry: 'CL',
        },
        areaServed: {
            '@type': 'Place',
            name: 'Litoral Central, Región de Valparaíso, Chile',
        },
        priceRange: '$$',
        openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            opens: '09:00',
            closes: '18:00',
        },
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    )
}

export function LocalBusinessSchema() {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: SITE.name,
        url: SITE.url,
        logo: `${SITE.url}/images/logo-alimin.png`,
        image: `${SITE.url}/images/logo-alimin.png`,
        description: SITE.description,
        telephone: SITE.phone,
        email: SITE.email,
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'El Tabo',
            addressRegion: 'Valparaíso',
            addressCountry: 'CL',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: -33.4565,
            longitude: -71.6350,
        },
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    )
}

export function FAQSchema() {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    )
}

export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    )
}
