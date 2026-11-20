#!/usr/bin/env node
/**
 * Casos de prueba de Ali en redes y WhatsApp (feedback de Marcela, 20-11-2026).
 *
 * Corre cada caso contra /api/ali/prueba (la misma Ali de Instagram, Facebook
 * y WhatsApp, en modo prueba: no crea leads ni avisa a nadie) y revisa la
 * respuesta con reglas simples. Sirve para comprobar que un cambio en las
 * instrucciones no rompe lo que ya funcionaba.
 *
 *   node scripts/casos-ali.mjs                  # contra https://aliminspa.cl
 *   node scripts/casos-ali.mjs http://localhost:3000
 *   node scripts/casos-ali.mjs audio            # solo los casos con "audio" en el nombre
 *
 * Cada caso cuesta una llamada a Claude. El endpoint deja 60 por hora por IP.
 */

// Argumentos: una URL base (opcional) y un texto para correr solo los casos cuyo nombre lo contenga.
const args = process.argv.slice(2)
const BASE = (args.find(a => /^https?:\/\//.test(a)) || 'https://aliminspa.cl').replace(/\/$/, '')
const FILTRO = (args.find(a => !/^https?:\/\//.test(a)) || '').toLowerCase()

const BROCHURE =
    '[Mensaje automático con el brochure] ¡Hola! 👋 Te dejamos el brochure de Lomas del Mar con precios, formas de pago y lo que incluye. Lomas del Mar, terreno de 200 m², $35.000.000 al contado o pie de $5.500.000 y 60 cuotas de $550.000. Si tienes cualquier duda, escríbenos por aquí mismo y con gusto te ayudamos 😊'

const cliente = texto => ({ de: 'cliente', texto })
const ali = texto => ({ de: 'ali', texto })

const tienePrecio = r => r.texto.includes('$')
const pregunta = r => r.texto.includes('?')

/** Cada caso: conversación, y lo que la respuesta debe (true) cumplir. */
const CASOS = [
    {
        nombre: 'Messenger: 👍 al brochure → se presenta corto, sin precio ni pregunta de nombre',
        canal: 'facebook',
        mensajes: [ali(BROCHURE), cliente('👍')],
        reglas: {
            'no manda precios': r => !tienePrecio(r),
            'no usa el precio de gancho': r => !/te cuento el precio/i.test(r.texto),
            'no pide el nombre': r => !/con qui[eé]n tengo el gusto|c[oó]mo te llamas|tu nombre/i.test(r.texto),
            'un solo mensaje': r => r.burbujas.length === 1,
        },
    },
    {
        nombre: 'Messenger: "Ya lo vi, gracias" + 👍 → cierre cálido, sin precios (caso Marcela 1)',
        canal: 'facebook',
        mensajes: [
            ali(BROCHURE),
            cliente('👍'),
            ali('Hola, soy Ali, del equipo de Alimin 👋\n\n¿Con quién tengo el gusto? Así te cuento el precio del terreno que te interesa.'),
            cliente('Ya lo vi, gracias'),
            cliente('👍'),
        ],
        reglas: {
            'no manda ni ofrece precios': r => !tienePrecio(r) && !/precio/i.test(r.texto),
            'sin pregunta': r => !pregunta(r),
            'responde algo (no se queda callada)': r => r.burbujas.length > 0,
            'un solo mensaje': r => r.burbujas.length === 1,
        },
    },
    {
        nombre: 'Messenger: otro 👍 después de que Ali ya se despidió → no responde',
        canal: 'facebook',
        mensajes: [
            ali(BROCHURE),
            cliente('Ya lo vi, gracias'),
            ali('Perfecto 😊 Cualquier duda me escribes por aquí'),
            cliente('👍'),
        ],
        reglas: {
            'silencio a propósito': r => r.silencio === true && r.burbujas.length === 0,
        },
    },
    {
        nombre: 'Instagram: "Gracias por la información" al brochure → sin precios (caso Marcela 2)',
        canal: 'instagram',
        mensajes: [ali(BROCHURE), cliente('Gracias por la información')],
        reglas: {
            'no manda precios': r => !tienePrecio(r),
            'no manda listas': r => !r.texto.includes('✅'),
            'responde algo': r => r.burbujas.length > 0,
        },
    },
    {
        nombre: 'Instagram: varios emojis (🙏❤️) → respuesta corta y cálida, sin precios',
        canal: 'instagram',
        mensajes: [ali(BROCHURE), cliente('🙏❤️')],
        reglas: {
            'no manda precios': r => !tienePrecio(r),
            'un solo mensaje': r => r.burbujas.length === 1,
        },
    },
    {
        nombre: 'WhatsApp: sticker solo → corto, sin precios',
        canal: 'whatsapp',
        mensajes: [cliente('Hola'), ali('Hola, soy Ali, del equipo de Alimin 👋\n\n¿Con quién tengo el gusto?'), cliente('[Sticker]')],
        reglas: {
            'no manda precios': r => !tienePrecio(r),
            'no repite la presentación': r => !/soy Ali/i.test(r.texto),
        },
    },
    {
        nombre: 'Emoji + pregunta → responde la pregunta normal',
        canal: 'instagram',
        mensajes: [ali(BROCHURE), cliente('👍 ¿y dónde queda exactamente?')],
        reglas: {
            'habla de la ubicación': r => /El Tabo|playa|Ruta 78|Santiago|ubica/i.test(r.texto),
        },
    },
    {
        nombre: 'Precio de Lomas del Mar sin tamaño → los dos tamaños, primero 200 m²',
        canal: 'instagram',
        mensajes: [cliente('Hola, ¿cuánto valen los terrenos de Lomas del Mar?')],
        reglas: {
            'trae los dos tamaños': r => /200 m²/.test(r.texto) && /390 m²/.test(r.texto),
            'primero el de 200 m²': r => r.texto.indexOf('200 m²') < r.texto.indexOf('390 m²'),
            'precio completo (contado y total con crédito)': r => r.texto.includes('35.000.000') && r.texto.includes('43.000.000'),
        },
    },
    {
        nombre: 'Precio de un tamaño puntual → solo ese',
        canal: 'instagram',
        mensajes: [cliente('¿Cuánto vale el terreno de 390 m² en Lomas del Mar?')],
        reglas: {
            'da el de 390 m²': r => r.texto.includes('43.000.000'),
            'no mete el de 200 m² en la lista': r => !r.texto.includes('35.000.000'),
        },
    },
    {
        nombre: '"Demasiado alto el valor" → ofrece el más accesible una vez, sin insistir',
        canal: 'instagram',
        mensajes: [
            cliente('¿Cuánto vale el de 390?'),
            ali('Lomas del Mar, terreno de 390 m² 🌲\n✅ $43.000.000 al contado\n✅ O con crédito directo, pie de $7.500.000\n✅ y 70 cuotas fijas de $550.000\n✅ $45.990.000 en total con crédito\n\n¿Con quién tengo el gusto?'),
            cliente('Demasiado alto el valor para mi muchas gracias'),
        ],
        reglas: {
            'ofrece el de 200 m² o el pie de $5.500.000': r => /200 m²|5\.500\.000/.test(r.texto),
            'no repite el precio del 390': r => !r.texto.includes('43.000.000'),
        },
    },
    {
        nombre: 'WhatsApp: audio "¿me escuchas?" → "te escucho", nunca "te leo"',
        canal: 'whatsapp',
        mensajes: [
            cliente('Hola'),
            ali('¡Hola! 👋 ¿En qué te puedo ayudar? Si estás buscando terreno en El Tabo, te cuento de Lomas del Mar o de Arena y Sol.'),
            cliente('🎤 (audio) Hola, ¿me escuchas?'),
        ],
        reglas: {
            'dice que lo escucha': r => /escucho|escuchar/i.test(r.texto),
            'no dice "te leo"': r => !/te leo|leo bien|leerte/i.test(r.texto),
        },
    },
]

async function correr(caso) {
    const res = await fetch(`${BASE}/api/ali/prueba`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            canal: caso.canal,
            id: `casos-${Date.now()}`,
            cliente: { nombre: null, telefono: null, email: null },
            mensajes: caso.mensajes,
        }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    const burbujas = data.burbujas || []
    return { burbujas, texto: burbujas.join('\n\n'), silencio: Boolean(data.silencio) }
}

const elegidos = CASOS.filter(c => !FILTRO || c.nombre.toLowerCase().includes(FILTRO))
let fallas = 0
for (const caso of elegidos) {
    try {
        const r = await correr(caso)
        const malas = Object.entries(caso.reglas).filter(([, ok]) => !ok(r)).map(([n]) => n)
        fallas += malas.length ? 1 : 0
        console.log(`\n${malas.length ? '✗' : '✓'} ${caso.nombre}`)
        console.log(r.silencio ? '   (sin respuesta, a propósito)' : r.burbujas.map(b => `   │ ${b.replace(/\n/g, '\n   │ ')}`).join('\n   ·\n'))
        for (const m of malas) console.log(`   ✗ no cumple: ${m}`)
    } catch (error) {
        fallas++
        console.log(`\n✗ ${caso.nombre}\n   error: ${error.message}`)
    }
}
console.log(`\n${elegidos.length - fallas}/${elegidos.length} casos bien.`)
process.exit(fallas ? 1 : 0)
