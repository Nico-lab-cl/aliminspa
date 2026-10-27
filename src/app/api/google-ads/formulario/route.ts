import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { forwardLeadToCrm } from '@/lib/crm-webhook'
import { POLITICA_VERSION } from '@/lib/consent'
import { UTM_GOOGLE_BUSQUEDA } from '@/lib/landing-variante'

/**
 * Webhook del formulario de clientes potenciales de Google Ads (el que se
 * llena sin salir de Google). Google manda cada lead aquí apenas se envía;
 * se guarda en `leads` y se reenvía al CRM igual que los del sitio.
 *
 * En Google Ads, en el recurso del formulario: URL del webhook
 * https://aliminspa.cl/api/google-ads/formulario y como clave el valor de
 * GOOGLE_LEAD_FORM_KEY. Google la manda en `google_key`.
 *
 * Google espera un 200 con cuerpo vacío; si no lo recibe, reintenta.
 */

interface ColumnaGoogle {
    column_id?: string
    column_name?: string
    string_value?: string
}

interface LeadGoogle {
    lead_id?: string
    user_column_data?: ColumnaGoogle[]
    google_key?: string
    is_test?: boolean
    gcl_id?: string
    adgroup_id?: number | string
    campaign_id?: number | string
    form_id?: number | string
}

const ESTANDAR = new Set(['FULL_NAME', 'FIRST_NAME', 'LAST_NAME', 'EMAIL', 'PHONE_NUMBER', 'CITY'])

function claveCorrecta(recibida: unknown, esperada: string) {
    if (typeof recibida !== 'string') return false
    const a = Buffer.from(recibida)
    const b = Buffer.from(esperada)
    return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
    const clave = process.env.GOOGLE_LEAD_FORM_KEY
    if (!clave) return new NextResponse('Not found', { status: 404 })

    let body: LeadGoogle
    try {
        body = await request.json()
    } catch {
        return new NextResponse('Payload JSON inválido', { status: 400 })
    }
    if (!claveCorrecta(body.google_key, clave)) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const columnas = body.user_column_data || []
    const valor = (id: string) => columnas.find(c => c.column_id === id)?.string_value?.trim() || ''

    const nombre =
        valor('FULL_NAME') || [valor('FIRST_NAME'), valor('LAST_NAME')].filter(Boolean).join(' ') || 'Sin nombre'
    const email = valor('EMAIL')
    const celular = valor('PHONE_NUMBER')
    // Las preguntas propias del formulario (p. ej. qué proyecto le interesa)
    // llegan con un column_id que no es de los estándar.
    const respuestas = columnas
        .filter(c => c.column_id && !ESTANDAR.has(c.column_id) && c.string_value)
        .map(c => c.string_value!.trim())

    // "Enviar datos de prueba" en Google Ads: se confirma la conexión sin
    // ensuciar la base ni el CRM.
    if (body.is_test) {
        console.log('Formulario de Google Ads: lead de prueba recibido', { nombre, email, celular, respuestas })
        return new NextResponse(null, { status: 200 })
    }

    if (!email && !celular) {
        console.error('Formulario de Google Ads: lead sin correo ni teléfono', body.lead_id)
        return new NextResponse(null, { status: 200 })
    }

    const proyecto = ['Formulario Google', ...respuestas].join(' - ')
    const utm = {
        ...UTM_GOOGLE_BUSQUEDA,
        utm_content: body.adgroup_id ? String(body.adgroup_id) : null,
        utm_term: null,
    }

    const datos = {
        nombre,
        email,
        celular,
        ciudad: valor('CITY') || 'No especificada',
        proyecto,
        fuente: 'google-formulario',
        como_conocio: 'Google',
        ...utm,
    }

    // La persona envió el formulario para que la contacten, con nuestra
    // política de privacidad enlazada en él. No aceptó publicidad.
    const consentimiento = {
        consentimiento_contacto: true,
        consentimiento_marketing: false,
        consentimiento_at: new Date(),
        politica_version: POLITICA_VERSION,
        consentimiento_origen: `Formulario de Google Ads ${body.form_id ?? ''}`.trim(),
    }

    try {
        await prisma.lead.create({ data: { ...datos, ...consentimiento } })
    } catch (e) {
        // Un lead perdido es lo peor que puede pasar: si falla el guardado,
        // igual se manda al CRM.
        console.error('Formulario de Google Ads: no se pudo guardar el lead', e)
    }

    await forwardLeadToCrm(datos)

    return new NextResponse(null, { status: 200 })
}
