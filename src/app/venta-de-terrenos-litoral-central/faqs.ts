// FAQ de la landing "Venta de Terrenos Litoral Central".
// Preguntas seleccionadas según intención de búsqueda real (Ubersuggest + SERP:
// El Tabo, El Quisco, Algarrobo, Isla Negra, "terreno playa litoral central",
// financiamiento sin banco / DICOM, loteos brujos, plusvalía). Se usan tanto en la
// UI (acordeón) como en el JSON-LD FAQPage para rich results de Google.

export interface Faq {
    q: string
    a: string
}

export const FAQS: Faq[] = [
    {
        q: '¿Qué incluyen los terrenos en venta en el Litoral Central?',
        a: 'Nuestros terrenos en El Tabo incluyen rol propio inscrito en el Conservador de Bienes Raíces, agua potable certificada por la SEREMI, luz eléctrica, portón automático y calles compactadas. Están urbanizados y listos para construir tu casa en la playa.',
    },
    {
        q: '¿Puedo comprar un terreno sin historial crediticio o con DICOM?',
        a: 'Sí. El financiamiento es directo con Alimin, sin evaluación bancaria ni aval. No importa si tienes DICOM u otro historial crediticio complejo: es la forma más simple de comprar un terreno en el Litoral Central.',
    },
    {
        q: '¿Cuánto cuesta un terreno en el Litoral Central y cómo es el pie?',
        a: 'En Lomas del Mar (El Tabo) el pie parte en $5.500.000 para 200 m² y en Arena y Sol en $20.000.000 para 200 m², con cuotas mensuales referenciales de $500.000 a $550.000. Cotiza en línea para recibir la lista de precios actualizada.',
    },
    {
        q: '¿Es seguro comprar un terreno en el Litoral Central?',
        a: 'Totalmente. A diferencia de los "loteos brujos", cada terreno se firma ante notario y se inscribe con rol propio individual en el Conservador de Bienes Raíces. La escritura queda a tu nombre, con respaldo legal en cada etapa del proceso.',
    },
    {
        q: '¿Qué significa que un terreno tenga rol propio y esté urbanizado?',
        a: 'Rol propio significa que el terreno tiene su propia inscripción individual en el Conservador de Bienes Raíces, sin copropiedad ni promesas sin respaldo. Urbanizado significa que ya cuenta con agua certificada, luz, accesos y calles: puedes construir de inmediato.',
    },
    {
        q: '¿Comprar un terreno en el Litoral Central es una buena inversión?',
        a: 'Sí. El Litoral Central —El Tabo, El Quisco, Algarrobo, Isla Negra— es una de las zonas costeras de mayor plusvalía de Chile. Un terreno urbanizado con rol propio se valoriza cada temporada y es patrimonio familiar que puedes construir, arrendar o revender.',
    },
    {
        q: '¿Dónde están ubicados los proyectos de terrenos?',
        a: 'Ambos proyectos, Lomas del Mar y Arena y Sol, están en la comuna de El Tabo, Región de Valparaíso, en pleno Litoral Central. Quedan a unos 4 km (8 a 10 minutos) de la playa y a minutos de El Quisco, Isla Negra y Algarrobo, con excelente conectividad vial.',
    },
    {
        q: '¿Puedo visitar los terrenos antes de comprar?',
        a: '¡Por supuesto! Coordinamos visitas guiadas gratuitas con nuestro equipo de asesores. Completa el formulario de cotización o escríbenos por WhatsApp y agendamos tu visita al loteo en El Tabo.',
    },
    {
        q: '¿Qué necesito para comprar un terreno en el Litoral Central?',
        a: 'Solo tu cédula de identidad vigente y el pago del pie inicial. El proceso es simple y transparente: te acompañamos en toda la parte legal y de escrituración ante notario hasta que el terreno queda inscrito a tu nombre.',
    },
]
