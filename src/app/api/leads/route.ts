import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMetaEvent } from '@/lib/meta-capi'
import { forwardLeadToCrm } from '@/lib/crm-webhook'

export async function POST(request: NextRequest) {
    try {
        let body
        try {
            body = await request.json()
        } catch (e) {
            console.error('Error parsing request body:', e)
            return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 })
        }

        const {
            nombre, email, celular, ciudad, proyecto, como_conocio,
            fbp, fbc, eventId,
            utm_source, utm_medium, utm_campaign, utm_content, utm_term
        } = body

        if (!nombre || !email || !celular || !ciudad) {
            return NextResponse.json(
                { error: 'Todos los campos son obligatorios: nombre, email, celular, ciudad' },
                { status: 400 }
            )
        }

        const baseData = {
            nombre,
            email,
            celular,
            ciudad,
            proyecto: proyecto || null,
            fuente: 'web',
            utm_source: utm_source || null,
            utm_medium: utm_medium || null,
            utm_campaign: utm_campaign || null,
            utm_content: utm_content || null,
            utm_term: utm_term || null,
        }

        // La columna como_conocio se agregó en agosto de 2026. Si el deploy llega
        // antes de que corra el ALTER TABLE en la base, el insert fallaría y se
        // perdería el lead — que es lo peor que puede pasar acá. Por eso se
        // reintenta sin la columna en vez de devolver error. Este fallback se
        // puede borrar una vez que la columna exista en todos los ambientes.
        let lead
        try {
            lead = await prisma.lead.create({
                data: { ...baseData, como_conocio: como_conocio || null },
            })
        } catch (e) {
            console.error('Fallo el insert con como_conocio, reintentando sin esa columna:', e)
            lead = await prisma.lead.create({ data: baseData })
        }

        // Enviar lead al CRM en tiempo real (best-effort, nunca bloquea ni rompe el guardado)
        await forwardLeadToCrm({
            nombre,
            email,
            celular,
            ciudad,
            proyecto,
            utm_source,
            utm_medium,
            utm_campaign,
            utm_content,
            utm_term,
        })

        // Enviar evento a Meta Conversions API
        const client_ip_address = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
        const client_user_agent = request.headers.get('user-agent') || ''
        const eventSourceUrl = request.headers.get('referer') || 'https://aliminspa.cl'

        try {
            await sendMetaEvent(
                'Lead',
                {
                    em: email,
                    ph: celular,
                    fn: nombre,
                    ct: ciudad,
                    external_id: lead.id,
                    client_ip_address,
                    client_user_agent,
                    fbp,
                    fbc,
                },
                {
                    content_name: proyecto || 'General',
                    content_category: 'Real Estate',
                },
                eventSourceUrl,
                // Mismo ID que el evento del navegador: Meta descarta la copia repetida
                eventId
            )
        } catch (err) {
            console.error('Error sending Meta Lead event:', err)
        }

        return NextResponse.json({ success: true, id: lead.id }, { status: 201 })
    } catch (error: any) {
        console.error('Error creating lead (Full Details):', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        })
        
        return NextResponse.json(
            { 
                error: 'Error interno del servidor', 
                message: process.env.NODE_ENV === 'development' ? error.message : undefined 
            },
            { status: 500 }
        )
    }
}
