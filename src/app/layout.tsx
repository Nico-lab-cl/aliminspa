import type { Metadata } from 'next'
import Script from 'next/script'
import '@/styles/globals.css'
import { SITE } from '@/lib/constants'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { RealEstateAgentSchema, LocalBusinessSchema } from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  icons: {
    icon: '/favicon.png?v=1',
    shortcut: '/favicon.png?v=1',
    apple: '/favicon.png?v=1',
  },
  title: {
    default: `Terrenos en Venta en El Tabo con Rol Propio | ${SITE.name}`,
    template: `%s | ${SITE.name}`,
  },
  description: 'Venta de terrenos urbanizados en El Tabo, Litoral Central. Lotes desde 200 m² con rol propio, agua y luz certificada. ¡Tu inversión segura frente al mar con Alimin!',
  keywords: [
    'venta de terrenos en el tabo',
    'terrenos en venta el tabo',
    'parcelas en el tabo con rol propio',
    'inmobiliaria el tabo',
    'proyectos inmobiliarios litoral central',
    'venta de terrenos urbanizados chile',
    'terrenos con vista al mar el tabo',
    'alimin inmobiliaria el tabo',
    'lomas del mar el tabo',
    'arena y sol el tabo',
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  publisher: SITE.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: SITE.url,
    siteName: SITE.name,
    title: `Terrenos en Venta en El Tabo con Rol Propio | ${SITE.name}`,
    description: 'Venta de terrenos urbanizados en El Tabo, Litoral Central. Lotes desde 200 m² con rol propio, agua y luz certificada. ¡Tu inversión segura frente al mar con Alimin!',
    images: [
      {
        url: '/images/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Alimin Inmobiliaria - Terrenos en Venta en El Tabo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Terrenos en Venta en El Tabo | ${SITE.name}`,
    description: 'Venta de terrenos urbanizados en El Tabo, Litoral Central. Lotes con rol propio y servicios básicos.',
    images: ['/images/og-image.webp'],
  },
  alternates: {
    canonical: SITE.url,
    languages: {
      'es-CL': SITE.url,
    },
  },
  other: {
    'geo.region': 'CL-VS',
    'geo.placename': 'El Tabo',
    'geo.position': '-33.4542;-71.6667',
    'ICBM': '-33.4542, -71.6667',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es-CL">
      <head>
        {/* Google tag (gtag.js) */}
        <Script strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=G-XRX761CCKM" />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XRX761CCKM');
            `,
          }}
        />
        <meta name="theme-color" content="#FFFFFF" />
        <RealEstateAgentSchema />
        <LocalBusinessSchema />
        
        {/* Meta Pixel Code */}
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${SITE.pixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
        
        {/* CRM Activity Tracker */}
        <Script
          id="crm-activity-tracker"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // 1. CONFIGURACIÓN: Endpoint de tu CRM ya integrado
                const CRM_API_URL = 'https://marketing.aliminlomasdelmar.com/api/track/activity';

                // 2. EXTRAER Y GUARDAR EL LEAD ID
                // Si el usuario llega desde un enlace de correo (ej: ?lead_id=xxxxx), guardamos su ID
                const urlParams = new URLSearchParams(window.location.search);
                let leadId = urlParams.get('lead_id');
                
                if (leadId) {
                  localStorage.setItem('crm_lead_id', leadId);
                } else {
                  // Si no viene en la URL, intentamos recuperarlo de sesiones anteriores
                  leadId = localStorage.getItem('crm_lead_id');
                }

                // 3. FUNCIÓN GLOBAL PARA REPORTAR EVENTOS AL CRM
                // Puedes usar esta función en cualquier parte de tu código de la web
                window.trackCRMEvent = function(eventType, details = {}) {
                  if (!leadId) {
                    console.log('[CRM Tracker] Evento omitido: El visitante no está identificado como lead.');
                    return;
                  }

                  const payload = {
                    lead_id: leadId,
                    event_type: eventType,
                    page_url: window.location.href,
                    page_title: document.title,
                    details: details
                  };

                  fetch(CRM_API_URL, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload),
                    mode: 'cors'
                  })
                  .then(response => response.json())
                  .then(data => {
                    console.log('[CRM Tracker] Evento registrado con éxito:', eventType, data);
                  })
                  .catch(error => {
                    console.error('[CRM Tracker] Error al reportar evento:', error);
                  });
                };

                // 4. SEGUIMIENTO AUTOMÁTICO DE VISITAS DE PÁGINA (PAGE VIEWS)
                // Se ejecuta automáticamente al cargar cualquier página donde esté este script
                if (leadId) {
                  if (document.readyState === 'complete') {
                    trackCRMEvent('PAGE_VIEW');
                  } else {
                    window.addEventListener('load', function() {
                      trackCRMEvent('PAGE_VIEW');
                    });
                  }
                }

                // 5. SEGUIMIENTO AUTOMÁTICO DE ENVÍO DE FORMULARIOS
                // Escucha todos los formularios en tu web. Si se envían, los registra en tu CRM
                document.addEventListener('submit', function(e) {
                  if (!leadId) return;
                  const form = e.target;
                  const formId = form.id || form.getAttribute('name') || 'Formulario sin ID';
                  
                  // Captura los valores de forma segura (ignora contraseñas y campos ocultos)
                  const formData = {};
                  const inputs = form.querySelectorAll('input, select, textarea');
                  inputs.forEach(input => {
                    const name = input.name || input.id;
                    if (name && input.type !== 'password' && input.type !== 'hidden') {
                      formData[name] = input.value;
                    }
                  });

                  trackCRMEvent('FORM_SUBMIT', {
                    form_name: formId,
                    form_action: form.getAttribute('action') || '',
                    data: formData
                  });
                });

                // 6. SEGUIMIENTO AUTOMÁTICO DE CLICS EN BOTONES DE INTERÉS
                // Añade la clase CSS 'crm-track-click' a los botones que quieras medir
                document.addEventListener('click', function(e) {
                  if (!leadId) return;
                  const target = e.target.closest('.crm-track-click');
                  if (target) {
                    const buttonName = target.getAttribute('data-crm-name') || target.innerText || 'Botón';
                    const buttonCategory = target.getAttribute('data-crm-category') || 'General';
                    
                    trackCRMEvent('CLICK_BUTTON', {
                      element_name: buttonName,
                      category: buttonCategory
                    });
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${SITE.gtmId}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* Meta Pixel noscript */}
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${SITE.pixelId}&ev=PageView&noscript=1`}
          />
        </noscript>

        {children}

        {/* Google Tag Manager */}
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${SITE.gtmId}');`,
          }}
        />
      </body>
    </html>
  )
}
