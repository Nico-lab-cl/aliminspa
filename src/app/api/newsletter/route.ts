import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email } = body

        if (!email) {
            return NextResponse.json(
                { error: 'El correo electrónico es obligatorio' },
                { status: 400 }
            )
        }

        // Upsert to handle duplicates gracefully
        const subscriber = await prisma.newsletterSubscriber.upsert({
            where: { email },
            update: { active: true },
            create: { email },
        })

        return NextResponse.json({ success: true, id: subscriber.id }, { status: 201 })
    } catch (error) {
        console.error('Error creating newsletter subscriber:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
