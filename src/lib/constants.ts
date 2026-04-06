export const SITE = {
    name: 'Alimin Inmobiliaria',
    shortName: 'Alimin',
    domain: 'aliminspa.cl',
    url: 'https://aliminspa.cl',
    description: 'Proyectos inmobiliarios y venta de terrenos en El Tabo, Litoral Central. Terrenos urbanizados con rol propio, agua certificada y luz. Invierte en el Litoral Central de Chile.',
    phone: '+56956654833',
    whatsapp: '56956654833',
    email: 'bienesraices@aliminspa.cl',
    address: 'El Tabo, Región de Valparaíso, Chile',
    gtmId: 'GTM-TMLPLBN3',
    pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || '1998226647754673',
    social: {
        instagram: '',
        facebook: '',
    },
} as const

export const PROJECTS = [
    {
        id: 'lomas-del-mar',
        name: 'Lomas del Mar',
        slug: 'lomas-del-mar',
        tagline: 'Tu refugio cerca al mar',
        description: 'Una inversión inteligente. Terrenos urbanizados en El Tabo, diseñados para quienes buscan calidad de vida y alta plusvalía. ¡Solo el 25% disponible!',
        features: ['Rol Propio', 'Agua Certificada', 'Luz Eléctrica', 'Portón Automático'],
        location: 'El Tabo, Región de Valparaíso',
        distance: 'A 8 MINUTOS DE LA PLAYA DEL TABO',
        lotSize: 'Desde 200 m²',
        status: 'Terrenos Disponibles',
        soldPercentage: 25,
        externalUrl: 'https://aliminlomasdelmar.com?utm_source=aliminspa.cl&utm_medium=boton_reservas&utm_campaign=home_projects',
        image: '/images/projects/lomas-del-mar.webp',
        color: '#006D77', // Deep sea teal
        isFeatured: true,
        financing: {
            showDicom: true,
            hasDirectCredit: true,
            options: [
                {
                    pie: '$1.500.000',
                    terreno: '200 m²',
                    valorTotal: '$23.990.000',
                    cuotaReferencial: '$250.000',
                    plazo: '90 Cuotas'
                },
                {
                    pie: '$3.500.000',
                    terreno: '200 m²',
                    valorTotal: '$24.990.000',
                    cuotaReferencial: '$300.000',
                    plazo: '72 Cuotas'
                }
            ]
        }
    },
    {
        id: 'arena-y-sol',
        name: 'Arena y Sol',
        slug: 'arena-y-sol',
        tagline: '¡Tu propio lugar en El Tabo!',
        description: 'Quedan muy pocos cupos para asegurar tu espacio en este exitoso proyecto a solo 10 minutos de la costa.',
        features: ['Rol Propio', 'Agua Certificada', 'Luz Eléctrica', 'Portón Automático'],
        location: 'El Tabo, Región de Valparaíso',
        distance: 'A 10 MINUTOS DE LA PLAYA DEL TABO',
        lotSize: '200 m²',
        status: 'Últimos Terrenos',
        externalUrl: null,
        image: '/images/projects/arena-y-sol.webp',
        color: '#B8860B', // Dark goldenrod
        isFeatured: false,
        financing: {
            showDicom: true,
            hasDirectCredit: false,
            options: [
                {
                    terreno: '200 m²',
                    pie: '$15.000.000',
                    cuotaReferencial: '$500.000',
                    valorTotal: '39.990.000',
                    pagoContado: '35.000.000'
                }
            ]
        }
    },
    {
        id: 'libertad-y-alegria',
        name: 'Libertad y Alegría',
        slug: 'libertad-y-alegria',
        tagline: '¡Tu propio lugar en El Tabo!',
        description: 'Quedan muy pocos cupos para asegurar tu espacio en este exitoso proyecto a solo 10 minutos de la costa.',
        features: ['Rol Propio', 'Agua Certificada', 'Luz Eléctrica', 'Acceso Pavimentado'],
        location: 'El Tabo, Región de Valparaíso',
        distance: 'A 10 MINUTOS DE LA PLAYA DEL TABO',
        lotSize: 'Desde 200 m²',
        status: 'Proyecto Vendido',
        externalUrl: null,
        image: '/images/projects/libertad-y-alegria.webp',
        color: '#4A4A4A', // Muted gray for sold out
        isFeatured: false,
        financing: {
            showDicom: false,
            hasDirectCredit: false,
            options: [
                {
                    terreno: '200 m²',
                    pagoContado: '$56.990.000'
                }
            ]
        }
    },
] as const

export const BENEFITS = [
    {
        icon: 'shield',
        title: 'Rol Propio',
        description: 'Todos nuestros terrenos cuentan con rol propio inscrito en el Conservador de Bienes Raíces.',
    },
    {
        icon: 'droplet',
        title: 'Agua Certificada',
        description: 'Terrenos con abastecimiento de agua certificada y aprobada por la autoridad sanitaria.',
    },
    {
        icon: 'zap',
        title: 'Luz Eléctrica',
        description: 'Conexión eléctrica disponible en cada terreno para que construyas sin complicaciones.',
    },
    {
        icon: 'map-pin',
        title: 'Ubicación Privilegiada',
        description: 'A minutos de la playa, centros comerciales y con acceso directo a la carretera.',
    },
    {
        icon: 'trending-up',
        title: 'Plusvalía Garantizada',
        description: 'El Litoral Central es una de las zonas con mayor crecimiento inmobiliario en Chile.',
    },
    {
        icon: 'credit-card',
        title: 'Financiamiento Directo',
        description: 'Facilidades de pago sin necesidad de crédito bancario. Pie desde el 20%.',
    },
] as const

export const MINI_BENEFITS = [
    { iconImage: '/images/home_redesign/1.png_1.webp', label: 'Rol propio' },
    { iconImage: '/images/home_redesign/2.png_1.webp', label: 'Proyectos legales y urbanizados' },
    { iconImage: '/images/home_redesign/3.png_1.webp', label: 'Agua certificada por la SEREMI' },
    { iconImage: '/images/home_redesign/4.png_1.webp', label: 'Luz' },
    { iconImage: '/images/home_redesign/5.png_1.webp', label: 'Portón automático' },
    { iconImage: '/images/home_redesign/6.png_1.webp', label: 'Recinto cerrado' },
    { iconImage: '/images/home_redesign/7.png_1.webp', label: 'Calles compactadas con maicillo' },
    { iconImage: '/images/home_redesign/8.png_1.webp', label: 'luminarias solares' },
    { iconImage: '/images/home_redesign/9.png_1.webp', label: 'veredas con soleras' },
    { iconImage: '/images/home_redesign/10.png_1.webp', label: 'Estacionamiento para visitas' },
    { iconImage: '/images/home_redesign/11.png_1.webp', label: 'Áreas verdes' },
] as const

export const FAQ_ITEMS = [
    {
        question: '¿Qué incluyen los terrenos en venta en El Tabo?',
        answer: 'Nuestros terrenos incluyen rol propio inscrito en el Conservador de Bienes Raíces, agua certificada, luz eléctrica y acceso pavimentado. Están completamente urbanizados y listos para construir.',
    },
    {
        question: '¿Cuánto cuestan los terrenos en El Tabo?',
        answer: 'Los precios varían según el proyecto y la ubicación del lote. Contamos con opciones de financiamiento directo con pie desde el 20% y cuotas mensuales accesibles. Contáctanos para recibir la lista de precios actualizada.',
    },
    {
        question: '¿Puedo visitar los terrenos antes de comprar?',
        answer: 'Sí, realizamos visitas guiadas a todos nuestros proyectos. Puedes agendar tu visita comunicándote con nosotros por WhatsApp o completando el formulario de contacto.',
    },
    {
        question: '¿Dónde están ubicados los proyectos?',
        answer: 'Todos nuestros proyectos están ubicados en la comuna de El Tabo, Región de Valparaíso, en el Litoral Central de Chile. A pocos minutos de la playa y con excelente conectividad vial.',
    },
    {
        question: '¿Qué necesito para comprar un terreno?',
        answer: 'Solo necesitas tu cédula de identidad vigente y el pago del pie inicial. El proceso de compra es simple y transparente. Te acompañamos en todo el proceso legal y de escrituración.',
    },
    {
        question: '¿Los terrenos son aptos para construir?',
        answer: 'Sí, todos los terrenos cuentan con los permisos y certificaciones necesarias. Están urbanizados con servicios básicos de agua, luz y acceso, listos para que inicies tu proyecto de construcción.',
    },
] as const
