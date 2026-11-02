// Contenido del pillar "Terrenos en la playa del Litoral Central".
//
// Es la página madre del cluster de comunas (mapa SEO de noviembre de 2026):
// las páginas "terrenos cerca de Algarrobo / El Quisco / Punta de Tralca" y las
// de El Tabo y Las Cruces cuelgan de acá y enlazan de vuelta. Mientras esas
// páginas no existan, las tarjetas de comuna no llevan enlace (un enlace a un
// 404 resta). Cuando se publiquen, se llena `href`.
//
// Todos los datos operativos (precios, distancias, qué incluye) salen de lo
// que el sitio ya publica: TERRENOS de la landing de terrenos baratos y la
// ficha de Ali en src/lib/ali/conocimiento.ts. Si cambian allá, cambian acá.

export interface Comuna {
    id: string
    nombre: string
    etiqueta: string
    /** true = comuna donde están nuestros proyectos. */
    local: boolean
    texto: string
    href?: string
}

// De norte a sur, como se recorre la costa.
export const COMUNAS: Comuna[] = [
    {
        id: 'algarrobo',
        nombre: 'Algarrobo',
        etiqueta: 'Comuna vecina',
        local: false,
        texto: 'El balneario más al norte del Litoral Central y uno de los más buscados. Si estás mirando terrenos en Algarrobo, El Tabo queda a pocos minutos por la costa, con terrenos urbanizados y precios publicados.',
    },
    {
        id: 'el-quisco',
        nombre: 'El Quisco, Isla Negra y Punta de Tralca',
        etiqueta: 'Comuna vecina',
        local: false,
        texto: 'Isla Negra y Punta de Tralca son parte de la comuna de El Quisco, que limita con El Tabo. Lomas del Mar está a 12 minutos de Isla Negra, en la comuna de al lado.',
    },
    {
        id: 'el-tabo',
        nombre: 'El Tabo',
        etiqueta: 'Aquí están nuestros terrenos',
        local: true,
        texto: 'Lomas del Mar y Arena y Sol están en El Tabo, a 10 y 8 minutos de la playa. Terrenos urbanos de 200 y 390 m², con rol propio, agua potable y luz, desde $35.000.000.',
    },
    {
        id: 'las-cruces',
        nombre: 'Las Cruces',
        etiqueta: 'Parte de El Tabo',
        local: true,
        texto: 'Las Cruces es un balneario de la comuna de El Tabo. Quien busca terreno en Las Cruces encuentra en nuestros proyectos la misma comuna, los mismos servicios y la misma ruta a Santiago.',
    },
    {
        id: 'cartagena',
        nombre: 'Cartagena',
        etiqueta: 'Comuna vecina',
        local: false,
        texto: 'El balneario tradicional al sur de Las Cruces. Si lo que buscas es estar en esta parte de la costa, El Tabo te deja a minutos de Cartagena con un terreno urbanizado y propio.',
    },
    {
        id: 'san-antonio',
        nombre: 'San Antonio y Santo Domingo',
        etiqueta: 'Más al sur',
        local: false,
        texto: 'San Antonio es la capital de la provincia y concentra el comercio y los servicios de la zona. Santo Domingo cierra el Litoral Central por el sur.',
    },
]

// Lo que mueve el precio de un terreno en la costa. Son criterios generales
// para comparar avisos, no afirmaciones sobre precios de otras comunas.
export const FACTORES_PRECIO = [
    {
        titulo: 'Distancia al mar',
        desc: 'Primera línea y vista al mar cuestan bastante más. A unos minutos en auto de la playa se paga mucho menos por el mismo metro cuadrado.',
    },
    {
        titulo: 'Superficie',
        desc: 'Un terreno más grande cuesta más en total, pero suele salir más barato por m². Compara siempre el precio por metro cuadrado.',
    },
    {
        titulo: 'Servicios incluidos',
        desc: 'Un terreno sin agua ni luz parece barato hasta que sumas los empalmes. Revisa si el precio ya los trae.',
    },
    {
        titulo: 'Rol propio y escritura',
        desc: 'Un terreno con rol propio se inscribe a tu nombre y se puede vender o heredar. Un derecho o una acción no es lo mismo.',
    },
    {
        titulo: 'Forma de pago',
        desc: 'Al contado o a crédito cambia el total. Con crédito directo no pagas tasación ni gastos bancarios, pero el total financiado es mayor que el contado.',
    },
]

export const CHECKLIST = [
    {
        titulo: 'Que tenga rol propio',
        desc: 'Pide el rol del terreno y el certificado de dominio vigente del Conservador de Bienes Raíces.',
        href: '/blog/que-es-el-rol-propio-y-por-que-es-vital',
        enlace: 'Qué es el rol propio',
    },
    {
        titulo: 'Que sea urbano y esté aprobado',
        desc: 'La subdivisión debe estar aprobada por la Dirección de Obras Municipales (DOM) y tener recepción municipal.',
        href: '/blog/como-verificar-legalidad-terreno-antes-de-comprar',
        enlace: 'Cómo verificar que un terreno es legal',
    },
    {
        titulo: 'Que el agua esté certificada',
        desc: 'El agua potable debe venir con su certificación sanitaria, no solo con la promesa de que "va a llegar".',
        href: '/blog/certificacion-agua-seremi-salud',
        enlace: 'Cómo funciona la certificación del agua',
    },
    {
        titulo: 'Que el pago quede por escrito',
        desc: 'Pie, número de cuotas y valor de cada una deben estar en el contrato, en pesos y sin reajustes sorpresa.',
        href: '/blog/comprar-terreno-financiamiento-directo-dicom',
        enlace: 'Comprar con financiamiento directo',
    },
]

// Respuestas autocontenidas: Google las toma para "Otras preguntas" y el AI
// Overview, que ya cita a Alimin en "terrenos en la playa litoral central".
export const FAQS = [
    {
        q: '¿Cuánto cuesta un terreno en la playa del Litoral Central?',
        a: 'Depende de la comuna, la distancia al mar y si viene urbanizado. En Alimin, un terreno urbano de 200 m² en El Tabo cuesta $35.000.000 al contado en Lomas del Mar y $39.000.000 en Arena y Sol; el de 390 m² en Lomas del Mar cuesta $43.000.000. Todos incluyen rol propio, agua potable y luz.',
    },
    {
        q: '¿Qué comunas forman el Litoral Central?',
        a: 'De norte a sur: Algarrobo, El Quisco (con Isla Negra y Punta de Tralca), El Tabo (con Las Cruces), Cartagena, San Antonio y Santo Domingo, en la Región de Valparaíso.',
    },
    {
        q: '¿Se puede comprar un terreno en la playa sin crédito hipotecario?',
        a: 'Sí. Con el crédito directo de Alimin pagas un pie y el saldo en cuotas fijas en pesos, sin banco, sin aval y sin evaluación bancaria, aunque estés en DICOM. Por ejemplo, el terreno de 200 m² en Lomas del Mar se paga con $5.500.000 de pie y 60 cuotas de $550.000.',
    },
    {
        q: '¿Los terrenos tienen luz y agua?',
        a: 'Sí. Los terrenos de Lomas del Mar y Arena y Sol incluyen agua potable sin costo y luz eléctrica. No hay alcantarillado: cada dueño hace su propia fosa séptica cuando construye.',
    },
    {
        q: '¿A cuánto queda El Tabo de Santiago y de la playa?',
        a: 'El Tabo está a poco más de una hora de Santiago por la Ruta 78. Arena y Sol queda a 8 minutos de la playa y Lomas del Mar a 10 minutos.',
    },
    {
        q: '¿El terreno queda a mi nombre?',
        a: 'Sí. Cada terreno tiene rol propio, con inscripción individual en el Conservador de Bienes Raíces, y la escritura queda a nombre del comprador. Puedes construir, arrendar o revender.',
    },
]
