import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SITE } from '@/lib/constants';
import { BreadcrumbSchema } from '@/components/seo/JsonLd';
import AsesoresClient from './AsesoresClient';

export const metadata: Metadata = {
    title: 'Nuestros Asesores Comerciales',
    description: 'Ponte en contacto directo y al instante con nuestros asesores comerciales por WhatsApp o teléfono. Consulta sobre terrenos y financiamiento en El Tabo.',
    alternates: { canonical: `${SITE.url}/asesores` },
};

export default function AsesoresPage() {
    return (
        <>
            <BreadcrumbSchema
                items={[
                    { name: 'Inicio', url: SITE.url },
                    { name: 'Nuestros Asesores', url: `${SITE.url}/asesores` },
                ]}
            />
            <Suspense fallback={
                <div style={{ 
                    minHeight: '100vh', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    backgroundColor: '#ffffff', 
                    color: '#2C3E50' 
                }}>
                    Cargando...
                </div>
            }>
                <AsesoresClient />
            </Suspense>
        </>
    );
}
