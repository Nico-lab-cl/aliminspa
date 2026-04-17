import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMetaEvent } from '@/lib/meta-capi'

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
            nombre, email, celular, ciudad, proyecto,
            fbp, fbc,
            utm_source, utm_medium, utm_campaign, utm_content, utm_term
        } = body

        if (!nombre || !email || !celular || !ciudad) {
            return NextResponse.json(
                { error: 'Todos los campos son obligatorios: nombre, email, celular, ciudad' },
                { status: 400 }
            )
        }

        const lead = await prisma.lead.create({
            data: {
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
            },
        })

        // Enviar evento a Meta Conversions API
        const client_ip_address = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
        const client_user_agent = request.headers.get('user-agent') || ''
        const eventSourceUrl = request.headers.get('referer') || 'https://aliminspa.cl'

        // Ejecutar en segundo plano para no retrasar la respuesta al usuario
        sendMetaEvent(
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
            eventSourceUrl
        ).catch(err => console.error('Error sending Meta Lead event:', err))

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
