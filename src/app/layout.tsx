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
              window.AliminCRM = (function() {
                const CRM_API_URL = 'https://marketing.aliminspa.cl';

                function saveLeadId(id) {
                  if (id) {
                    localStorage.setItem('crm_lead_id', id);
                  }
                }

                function getLeadId() {
                  return localStorage.getItem('crm_lead_id');
                }

                function getOrCreateAnonymousId() {
                  let anonId = localStorage.getItem('crm_anonymous_id');
                  if (!anonId) {
                    anonId = 'anon_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                    localStorage.setItem('crm_anonymous_id', anonId);
                  }
                  return anonId;
                }

                function associate(leadId, anonymousId) {
                  if (!leadId || !anonymousId) return Promise.resolve();
                  console.log('[AliminCRM] Asociando lead_id ' + leadId + ' con anonymous_id ' + anonymousId);
                  return fetch(CRM_API_URL + '/api/track/associate', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ lead_id: leadId, anonymous_id: anonymousId })
                  })
                  .then(function(res) { return res.json(); })
                  .then(function(data) {
                    console.log('[AliminCRM] Asociación completada:', data);
                    return data;
                  })
                  .catch(function(err) { console.error('[AliminCRM] Error al asociar identidad:', err); });
                }

                function trackEvent(eventType, details) {
                  if (!details) details = {};
                  const leadId = getLeadId();
                  const anonymousId = getOrCreateAnonymousId();

                  const payload = {
                    lead_id: leadId || null,
                    anonymous_id: anonymousId,
                    event_type: eventType,
                    page_url: window.location.href,
                    page_title: document.title,
                    details: details
                  };

                  return fetch(CRM_API_URL + '/api/track/activity', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                  })
                  .then(function(res) { return res.json(); })
                  .then(function(data) {
                    console.log('[AliminCRM] Evento ' + eventType + ' registrado:', data);
                    return data;
                  })
                  .catch(function(err) { console.error('[AliminCRM] Error al registrar evento ' + eventType + ':', err); });
                }

                function trackPageView() {
                  const urlParams = new URLSearchParams(window.location.search);
                  var urlLeadId = urlParams.get('lead_id');
                  var anonId = getOrCreateAnonymousId();

                  if (urlLeadId) {
                    saveLeadId(urlLeadId);
                    associate(urlLeadId, anonId).then(function() {
                      trackEvent('PAGE_VISIT', {
                        referrer: document.referrer,
                        userAgent: navigator.userAgent
                      });
                    });
                  } else {
                    trackEvent('PAGE_VISIT', {
                      referrer: document.referrer,
                      userAgent: navigator.userAgent
                    });
                  }
                }

                function identify(contactData) {
                  if (!contactData || !contactData.email) {
                    console.warn('[AliminCRM] Para identificar al lead se requiere al menos un correo electrónico (email).');
                    return Promise.reject('Email requerido');
                  }
                  if (!contactData.source) {
                    contactData.source = 'Sitio Web';
                  }

                  console.log('[AliminCRM] Enviando datos de contacto al CRM...', contactData);
                  return fetch(CRM_API_URL + '/api/leads', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(contactData)
                  })
                  .then(function(res) { return res.json(); })
                  .then(function(data) {
                    if (data.success && data.lead && data.lead.id) {
                      const newLeadId = data.lead.id;
                      saveLeadId(newLeadId);
                      console.log('[AliminCRM] Contacto identificado exitosamente. ID:', newLeadId);
                      
                      const anonId = getOrCreateAnonymousId();
                      return associate(newLeadId, anonId).then(function() {
                        trackPageView();
                        return data.lead;
                      });
                    } else {
                      throw new Error(data.message || 'Error en respuesta del CRM');
                    }
                  })
                  .catch(function(err) {
                    console.error('[AliminCRM] Error al identificar contacto:', err);
                    throw err;
                  });
                }

                if (document.readyState === 'complete' || document.readyState === 'interactive') {
                  trackPageView();
                } else {
                  document.addEventListener('DOMContentLoaded', trackPageView);
                }

                const originalPushState = history.pushState;
                history.pushState = function() {
                  originalPushState.apply(this, arguments);
                  setTimeout(function() {
                    trackPageView();
                  }, 150);
                };

                const originalReplaceState = history.replaceState;
                history.replaceState = function() {
                  originalReplaceState.apply(this, arguments);
                  setTimeout(function() {
                    trackPageView();
                  }, 150);
                };

                window.addEventListener('popstate', function() {
                  trackPageView();
                });

                document.addEventListener('click', function(e) {
                  const target = e.target.closest('.crm-track-click, button, a');
                  if (!target) return;

                  const text = (target.innerText || target.textContent || '').trim();
                  const href = target.getAttribute('href') || '';
                  const tagName = target.tagName;
                  
                  const buttonName = target.getAttribute('data-crm-name') || text || href || 'Elemento Clickeado';
                  
                  let buttonCategory = target.getAttribute('data-crm-category') || 'General';
                  if (href.indexOf('wa.me') !== -1 || href.indexOf('whatsapp') !== -1) {
                    buttonCategory = 'WhatsApp';
                  } else if (href.startsWith('#')) {
                    buttonCategory = 'Sección Hash';
                  } else if (tagName === 'A') {
                    buttonCategory = 'Enlace Navegación';
                  } else if (tagName === 'BUTTON') {
                    buttonCategory = 'Botón Acción';
                  }

                  trackEvent('CLICK_BUTTON', {
                    element_name: buttonName,
                    category: buttonCategory,
                    href: href,
                    tag: tagName
                  });
                });

                window.trackCRMEvent = function(eventType, details) {
                  trackEvent(eventType, details);
                };

                return {
                  identify: identify,
                  trackPageView: trackPageView,
                  trackEvent: trackEvent,
                  getLeadId: getLeadId,
                  getOrCreateAnonymousId: getOrCreateAnonymousId
                };
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
