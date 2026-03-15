import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { 
            nombre, email, celular, ciudad, proyecto,
            utm_source, utm_medium, utm_campaign, utm_content, utm_term
        } = body

        if (!nombre || !email || !celular || !ciudad) {
            return NextResponse.json(
                { error: 'Todos los campos son obligatorios' },
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

        return NextResponse.json({ success: true, id: lead.id }, { status: 201 })
    } catch (error) {
        console.error('Error creating lead:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
