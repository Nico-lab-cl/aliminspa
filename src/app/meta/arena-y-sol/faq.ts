/* Fuente única del acordeón de FAQ y del FAQPage schema.
   Vive fuera del cliente porque page.tsx (servidor) también lo consume:
   los exports de un módulo 'use client' llegan al servidor como referencias,
   no como datos. */

export const FAQ_ARENA_Y_SOL = [
    {
        question: '¿La escritura queda a mi nombre?',
        answer: 'Sí. Cada lote tiene rol propio: la escritura queda a tu nombre y eres dueño de verdad, no de un papel de promesa.',
    },
    {
        question: '¿El agua ya está en el terreno?',
        answer: 'Sí. Arena y Sol tiene agua certificada y la conexión ya está en terreno. No es un compromiso a futuro.',
    },
    {
        question: '¿Hay luz eléctrica?',
        answer: 'Sí, el loteo cuenta con red de luz eléctrica y portón automático en el acceso.',
    },
    {
        question: '¿Puedo ir a ver el loteo antes de comprar?',
        answer: 'Claro, y te lo recomendamos. Coordinamos una visita contigo y te mostramos los lotes disponibles en terreno.',
    },
    {
        question: '¿Cómo es la forma de pago?',
        answer: 'Pie de $20.000.000 y cuotas referenciales de $500.000. El valor total es $42.000.000 en pesos, fijo. Si pagas al contado, son $39.000.000.',
    },
    {
        question: '¿Cuándo puedo tomar posesión de mi terreno?',
        answer: 'La urbanización está en estado avanzado y ya hay vecinos instalados con su cierre perimetral. Te confirmamos los plazos de entrega de tu lote al momento de cotizar.',
    },
]
