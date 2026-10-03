import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { forwardNewsletterSubscriberToCrm } from '@/lib/crm-webhook'
import { POLITICA_VERSION } from '@/lib/consent'
import { ipDe } from '@/lib/consent-server'
import { dentroDelLimite } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
    try {
        if (!dentroDelLimite(`newsletter:${ipDe(request)}`, 10, 10 * 60 * 1000)) {
            return NextResponse.json({ error: 'Demasiados envíos. Intenta en unos minutos.' }, { status: 429 })
        }

        const body = await request.json()
        const { email } = body

        if (!email) {
            return NextResponse.json(
                { error: 'El correo electrónico es obligatorio' },
                { status: 400 }
            )
        }

        // Suscribirse es en sí el consentimiento para recibir correos (Ley
        // 21.719): se guarda cuándo, con qué versión de la política y desde
        // qué página, y se limpia una baja anterior si la persona vuelve.
        const consentimiento = {
            consentimiento_at: new Date(),
            politica_version: typeof body.politica_version === 'string' ? body.politica_version.slice(0, 20) : POLITICA_VERSION,
            consentimiento_origen:
                (typeof body.consentimiento_origen === 'string' && body.consentimiento_origen.slice(0, 500)) ||
                request.headers.get('referer')?.slice(0, 500) ||
                null,
            baja_at: null,
        }

        // Upsert to handle duplicates gracefully. Si las columnas de
        // consentimiento todavía no existen (ALTER pendiente), se guarda igual.
        let subscriber
        try {
            subscriber = await prisma.newsletterSubscriber.upsert({
                where: { email },
                update: { active: true, ...consentimiento },
                create: { email, ...consentimiento },
            })
        } catch (e) {
            console.error('Fallo el upsert con consentimiento, reintentando sin esas columnas:', e)
            subscriber = await prisma.newsletterSubscriber.upsert({
                where: { email },
                update: { active: true },
                create: { email },
            })
        }

        // Enviar suscriptor al CRM en tiempo real (best-effort, nunca bloquea ni rompe el guardado)
        await forwardNewsletterSubscriberToCrm({ email })

        return NextResponse.json({ success: true, id: subscriber.id }, { status: 201 })
    } catch (error) {
        console.error('Error creating newsletter subscriber:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
