// FAQ de la landing "terrenos baratos en la playa litoral central chile".
//
// El SERP de esta keyword muestra un bloque "Otras preguntas de los usuarios"
// (posición 4) y un AI Overview (posición 5) por encima de casi todos los
// resultados orgánicos. Estas preguntas están escritas para ganarse ese
// espacio: la primera frase de cada respuesta contesta sola, con el dato
// concreto adelante, para que sea extraíble como snippet. Se usan en el
// acordeón y en el JSON-LD FAQPage.

export interface Faq {
    q: string
    a: string
}

export const FAQS: Faq[] = [
    {
        q: '¿Cuánto cuesta un terreno barato en la playa del Litoral Central?',
        a: 'El terreno más barato de Alimin en el Litoral Central cuesta $35.000.000 al contado: 200 m² urbanizados en Lomas del Mar, El Tabo, a 8 minutos de la playa. Financiado queda en $37.990.000 con un pie de $5.500.000 y 60 cuotas de $550.000. El de mejor precio por m² es el lote de 390 m² a $110.256 el m².',
    },
    {
        q: '¿Dónde encuentro los terrenos más baratos en la playa en Chile?',
        a: 'En el Litoral Central, a pocos kilómetros del borde costero. Las comunas de El Tabo, El Quisco, Algarrobo e Isla Negra concentran los terrenos de playa más accesibles cerca de Santiago. Nuestros loteos están en El Tabo, Región de Valparaíso, a unos 4 km de la playa y a poco más de una hora de Santiago por la Ruta 78.',
    },
    {
        q: '¿Por qué estos terrenos son más baratos que los de los portales inmobiliarios?',
        a: 'Porque compras directo al dueño del loteo, sin corredor de por medio, así que el precio no incluye comisión de corretaje. Además urbanizamos cientos de lotes a la vez —el costo de agua, luz, calles y portón se reparte entre todos— y financiamos nosotros, sin banco, por lo que no pagas intereses bancarios, tasación ni gastos operacionales.',
    },
    {
        q: '¿Los terrenos baratos incluyen agua y luz?',
        a: 'Sí. Todos nuestros terrenos incluyen empalme de agua potable certificado por la Seremi de Salud y empalme de luz eléctrica, sin costo adicional. También vienen con calles compactadas, veredas con soleras, luminarias solares, portón automático y áreas verdes. El precio publicado es el precio del terreno urbanizado y listo para construir.',
    },
    {
        q: '¿Puedo comprar un terreno barato en la playa sin banco y con DICOM?',
        a: 'Sí. El financiamiento es directo con Alimin, sin evaluación bancaria ni aval, y no importa si estás en DICOM. Pagas un pie desde $5.500.000 y el saldo en cuotas mensuales desde $500.000. Es la forma más simple de comprar un terreno en el Litoral Central si no calificas para un crédito hipotecario.',
    },
    {
        q: '¿Un terreno barato en la playa es una buena inversión?',
        a: 'Sí. El Litoral Central es una de las zonas costeras de mayor plusvalía de Chile y un terreno urbanizado con rol propio se valoriza cada temporada. Comprar barato hoy en El Tabo te deja un patrimonio que puedes construir, arrendar en verano o revender más caro.',
    },
    {
        q: '¿A cuánto está el metro cuadrado de terreno en el Litoral Central?',
        a: 'En nuestros loteos de El Tabo el metro cuadrado va desde $110.256 en el lote de 390 m² y desde $175.000 en los lotes de 200 m², calculado sobre el valor al contado. El lote más grande siempre rinde mejor por metro cuadrado.',
    },
    {
        q: '¿Qué tan lejos de la playa quedan estos terrenos baratos?',
        a: 'A unos 4 km de la playa de El Tabo, entre 8 y 10 minutos en auto. Esa distancia es justamente lo que hace que el terreno sea barato: en primera línea de costa el mismo lote cuesta varias veces más. También quedas a minutos de El Quisco, Isla Negra y Algarrobo.',
    },
    {
        q: '¿Los terrenos son legales y tienen rol propio?',
        a: 'Sí. Cada terreno se firma ante notario y se inscribe con rol propio individual en el Conservador de Bienes Raíces, con la escritura a tu nombre. Los loteos cuentan con todos los permisos y están urbanizados, listos para construir.',
    },
    {
        q: '¿Puedo visitar los terrenos antes de comprar?',
        a: 'Sí, las visitas son gratuitas y sin compromiso. Coordinamos un recorrido guiado por el loteo en El Tabo con uno de nuestros asesores. Completa el formulario de cotización o escríbenos por WhatsApp y agendamos el día que te acomode.',
    },
]
