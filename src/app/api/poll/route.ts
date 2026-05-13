import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import crypto from 'crypto'

// ═══════════════════════════════════════════════════════════
// POST /api/poll — Registra un voto en la encuesta
// ═══════════════════════════════════════════════════════════
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { pollId, optionId, optionText, proyecto } = body

        if (!pollId || !optionId || !optionText) {
            return NextResponse.json(
                { error: 'Faltan campos obligatorios: pollId, optionId, optionText' },
                { status: 400 }
            )
        }

        // Generamos un fingerprint anónimo del IP para prevenir duplicados
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
            || headersList.get('x-real-ip')
            || 'unknown'
        const userAgent = headersList.get('user-agent') || undefined

        // Hash del IP para no almacenar datos personales directamente
        const fingerprint = crypto
            .createHash('sha256')
            .update(ip + (userAgent || ''))
            .digest('hex')
            .substring(0, 16)

        // Verificamos si este fingerprint ya votó en esta encuesta
        const existingVote = await prisma.pollVote.findFirst({
            where: { pollId, fingerprint },
        })

        if (existingVote) {
            // Ya votó, retornamos los resultados sin crear duplicado
            const results = await getResults(pollId)
            return NextResponse.json({
                success: true,
                alreadyVoted: true,
                results,
            })
        }

        // Registramos el nuevo voto
        await prisma.pollVote.create({
            data: {
                pollId,
                optionId,
                optionText,
                fingerprint,
                userAgent,
                proyecto: proyecto || null,
            },
        })

        // Retornamos los resultados actualizados
        const results = await getResults(pollId)

        return NextResponse.json({
            success: true,
            alreadyVoted: false,
            results,
        }, { status: 201 })

    } catch (error) {
        console.error('[Poll API] Error registrando voto:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

// ═══════════════════════════════════════════════════════════
// GET /api/poll?pollId=xxx — Obtiene los resultados actuales
// ═══════════════════════════════════════════════════════════
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const pollId = searchParams.get('pollId')

        if (!pollId) {
            return NextResponse.json(
                { error: 'Falta el parámetro pollId' },
                { status: 400 }
            )
        }

        const results = await getResults(pollId)

        return NextResponse.json({ success: true, results })
    } catch (error) {
        console.error('[Poll API] Error obteniendo resultados:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

// ═══════════════════════════════════════════════════════════
// Helper: Calcula los porcentajes de cada opción
// ═══════════════════════════════════════════════════════════
async function getResults(pollId: string) {
    const votes = await prisma.pollVote.groupBy({
        by: ['optionId'],
        where: { pollId },
        _count: { optionId: true },
    })

    const totalVotes = votes.reduce((sum, v) => sum + v._count.optionId, 0)

    // Mapa de optionId → { count, percentage }
    const results: Record<number, { count: number; percentage: number }> = {}

    for (const v of votes) {
        results[v.optionId] = {
            count: v._count.optionId,
            percentage: totalVotes > 0
                ? Math.round((v._count.optionId / totalVotes) * 100)
                : 0,
        }
    }

    return { totalVotes, results }
}
