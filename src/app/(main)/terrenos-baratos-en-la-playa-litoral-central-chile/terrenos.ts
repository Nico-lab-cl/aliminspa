// Listado de terrenos con precio público para la landing SEO
// "terrenos baratos en la playa litoral central chile".
//
// La intención de búsqueda es COMERCIAL y comparativa de precio: el SERP está
// copado por marketplaces (MercadoLibre, Portal Inmobiliario, Yapo, Trovit,
// Mitula, Doomos) que muestran valor. Para competir contra ellos esta página
// publica precios reales, no "consultar". Los valores son los mismos que
// PROJECTS en @/lib/constants — si cambian allá, hay que actualizarlos acá.
//
// `precioM2` está precalculado a mano para no mostrar decimales raros y para
// poder ordenar el listado de más barato a más caro sin lógica en el render.

export interface TerrenoBarato {
    id: string
    proyecto: string
    slug: string
    /** Etiqueta corta para el badge de la tarjeta. */
    badge: string
    superficie: string
    superficieM2: number
    /** Valor total financiado, en CLP. */
    precio: number
    precioTexto: string
    /** Valor al contado, más barato que el financiado. */
    contado: number
    contadoTexto: string
    pie: string
    cuota: string
    plazo: string
    /** Precio por m² sobre el valor contado (el más barato). */
    precioM2: string
    imagen: string
    plano: string
    color: string
    disponibilidad: 'InStock' | 'LimitedAvailability'
    disponibilidadTexto: string
    destacado: boolean
}

// Ordenados de más barato a más caro por valor contado: el usuario que busca
// "terrenos baratos" quiere ver primero el número más bajo.
export const TERRENOS: TerrenoBarato[] = [
    {
        id: 'lomas-200',
        proyecto: 'Lomas del Mar',
        slug: 'lomas-del-mar',
        badge: 'El más barato',
        superficie: '200 m²',
        superficieM2: 200,
        precio: 37990000,
        precioTexto: '$37.990.000',
        contado: 35000000,
        contadoTexto: '$35.000.000',
        pie: '$5.500.000',
        cuota: '$550.000',
        plazo: '60 cuotas',
        precioM2: '$175.000',
        imagen: '/assets/venta-terrenos/gallery/g10.webp',
        plano: '/assets/venta-terrenos/plano-lomas-del-mar.webp',
        color: '#76d845',
        disponibilidad: 'InStock',
        disponibilidadTexto: 'Terrenos disponibles',
        destacado: true,
    },
    {
        id: 'arena-200',
        proyecto: 'Arena y Sol',
        slug: 'arena-y-sol',
        badge: 'Últimos cupos',
        superficie: '200 m²',
        superficieM2: 200,
        precio: 42000000,
        precioTexto: '$42.000.000',
        contado: 39000000,
        contadoTexto: '$39.000.000',
        pie: '$20.000.000',
        cuota: '$500.000',
        plazo: 'Cuotas mensuales',
        precioM2: '$195.000',
        imagen: '/assets/venta-terrenos/gallery/g01.webp',
        plano: '/assets/venta-terrenos/plano-arena-y-sol-2026-08-24.webp',
        color: '#C5A059',
        disponibilidad: 'LimitedAvailability',
        disponibilidadTexto: 'Últimos terrenos',
        destacado: false,
    },
    {
        id: 'lomas-390',
        proyecto: 'Lomas del Mar',
        slug: 'lomas-del-mar',
        badge: 'Mejor precio por m²',
        superficie: '390 m²',
        superficieM2: 390,
        precio: 45990000,
        precioTexto: '$45.990.000',
        contado: 43000000,
        contadoTexto: '$43.000.000',
        pie: '$7.500.000',
        cuota: '$550.000',
        plazo: '70 cuotas',
        precioM2: '$110.256',
        imagen: '/assets/venta-terrenos/gallery/g12.webp',
        plano: '/assets/venta-terrenos/plano-lomas-del-mar.webp',
        color: '#76d845',
        disponibilidad: 'InStock',
        disponibilidadTexto: 'Terrenos disponibles',
        destacado: false,
    },
]

/** El valor más bajo del listado — se repite en el hero, el schema y el meta. */
export const PRECIO_DESDE = TERRENOS[0].contadoTexto
export const PIE_DESDE = TERRENOS[0].pie
export const CUOTA_DESDE = TERRENOS[0].cuota

// Lo que incluye el precio. Es la respuesta al "¿por qué tan barato?" que se
// hace todo el que busca terrenos baratos en la playa, y alimenta la sección
// de beneficios con el mismo lenguaje que usamos en el resto del sitio.
export const INCLUIDO = [
    {
        titulo: 'Rol propio',
        desc: 'Cada terreno se inscribe a tu nombre en el Conservador de Bienes Raíces. Sin copropiedad.',
    },
    {
        titulo: 'Agua certificada',
        desc: 'Empalme de agua potable certificado por la Seremi de Salud, incluido en el precio.',
    },
    {
        titulo: 'Luz eléctrica',
        desc: 'Empalme de luz disponible en todos los lotes. No pagas urbanización aparte.',
    },
    {
        titulo: 'Sin banco',
        desc: 'Financiamiento directo con Alimin. Sin crédito hipotecario y sin importar tu DICOM.',
    },
    {
        titulo: 'Recinto cerrado',
        desc: 'Portón automático y control de acceso al loteo, incluido en el valor del terreno.',
    },
    {
        titulo: 'Calles y veredas',
        desc: 'Calles compactadas con maicillo, veredas con soleras y luminarias solares.',
    },
    {
        titulo: 'A 8 minutos de la playa',
        desc: 'El Tabo, Litoral Central. Playa, supermercados y la ruta a Santiago a minutos.',
    },
    {
        titulo: 'Áreas verdes',
        desc: 'Áreas verdes y estacionamiento de visitas dentro del loteo, sin gasto común extra.',
    },
]

// Por qué el precio es más bajo que el de los portales. Son razones concretas
// del modelo de venta, no promesas: es lo que responde el AI Overview y el
// bloque "Otras preguntas" que Google ya muestra para esta búsqueda.
//
// Son tres a propósito. Había una cuarta sobre "urbanizar cientos de lotes a la
// vez para repartir el costo" que se eliminó en agosto de 2026: era falsa (el
// loteo se urbaniza completo, incluido todo el entorno, y eso no abarata el
// terreno) y además no sostenía el titular de la sección.
export const POR_QUE_BARATO = [
    {
        num: '01',
        titulo: 'Compras directo al dueño del loteo',
        desc: 'Alimin es la inmobiliaria propietaria del terreno. No hay corredor intermediario, así que el precio no carga comisión de corretaje.',
    },
    {
        num: '02',
        titulo: 'Financiamos nosotros, no el banco',
        desc: 'Al no pasar por un crédito hipotecario te ahorras intereses bancarios, tasación, gastos operacionales y seguros.',
    },
    {
        num: '03',
        titulo: 'Cerca del mar, sin pagar precio de primera línea',
        desc: 'Estás entre 8 y 10 minutos de la playa en auto. Nuestros terrenos no quedan pegados al mar, pero sí bien cerca: llegas a la playa cuando quieras y te ahorras el sobreprecio que se paga por estar en el borde costero.',
    },
]
