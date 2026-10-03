import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ipDe } from '@/lib/consent-server'
import { dentroDelLimite } from '@/lib/rate-limit'
import { TIPOS_DERECHO, type TipoDerecho } from '@/lib/derechos'

const DIA = 24 * 60 * 60 * 1000

/** Suma días hábiles (lunes a viernes; no descuenta feriados). */
function sumarDiasHabiles(desde: Date, dias: number): Date {
    const d = new Date(desde)
    let restantes = dias
    while (restantes > 0) {
        d.setDate(d.getDate() + 1)
        const dow = d.getDay()
        if (dow !== 0 && dow !== 6) restantes--
    }
    return d
}

/**
 * POST /api/derechos — Solicitud de un derecho de la Ley 21.719.
 *
 * Guarda la solicitud con su fecha de vencimiento legal: 30 días corridos, o
 * 2 días hábiles para el bloqueo temporal. Quien la responde la marca en la
 * tabla solicitudes_derechos (ver prisma/sql/2026-10-03-ley-21719.sql).
 *
 * Darse de baja y oponerse a la publicidad se aplican al tiro sobre los datos
 * del sitio, sin esperar a que alguien lo revise: dejar de escribirle a
 * alguien nunca le hace daño a nadie, aunque la pida un tercero. Lo demás
 * (acceso, borrado, portabilidad) requiere verificar la identidad antes.
 */
export async function POST(request: NextRequest) {
    try {
        if (!dentroDelLimite(`derechos:${ipDe(request)}`, 5, 60 * 60 * 1000)) {
            return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta más tarde o escríbenos.' }, { status: 429 })
        }

        const body = await request.json().catch(() => null)
        if (!body) return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 })

        const tipo = body.tipo as TipoDerecho
        const nombre = typeof body.nombre === 'string' ? body.nombre.trim().slice(0, 200) : ''
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 200) : ''
        const celular = typeof body.celular === 'string' ? body.celular.trim().slice(0, 30) : ''
        const detalle = typeof body.detalle === 'string' ? body.detalle.trim().slice(0, 4000) : ''

        if (!TIPOS_DERECHO.includes(tipo) || !nombre || !/^\S+@\S+\.\S+$/.test(email)) {
            return NextResponse.json({ error: 'Faltan datos: tipo de solicitud, nombre y correo válido.' }, { status: 400 })
        }

        const ahora = new Date()
        const vence_el = tipo === 'bloqueo' ? sumarDiasHabiles(ahora, 2) : new Date(ahora.getTime() + 30 * DIA)
        const aplicadaAlTiro = tipo === 'baja_comunicaciones' || tipo === 'oposicion'

        if (aplicadaAlTiro) {
            // Correo comparado sin mayúsculas: en leads y bookings se guardó tal
            // cual lo escribió la persona.
            await prisma.newsletterSubscriber.updateMany({
                where: { email: { equals: email, mode: 'insensitive' } },
                data: { active: false, baja_at: ahora },
            })
            await prisma.lead.updateMany({
                where: { email: { equals: email, mode: 'insensitive' } },
                data: { consentimiento_marketing: false },
            })
            await prisma.booking.updateMany({
                where: { email: { equals: email, mode: 'insensitive' } },
                data: { consentimiento_marketing: false },
            })
        }

        const solicitud = await prisma.solicitudDerecho.create({
            data: {
                tipo,
                nombre,
                email,
                celular: celular || null,
                detalle: detalle || null,
                // La baja del sitio ya quedó hecha, pero falta replicarla en el
                // CRM y en las audiencias de Meta: por eso queda en proceso.
                estado: aplicadaAlTiro ? 'en_proceso' : 'pendiente',
                vence_el,
            },
        })

        return NextResponse.json({ success: true, id: solicitud.id, vence_el }, { status: 201 })
    } catch (error) {
        console.error('Error en /api/derechos:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
