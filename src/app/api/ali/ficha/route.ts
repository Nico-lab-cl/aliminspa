import { NextRequest, NextResponse } from 'next/server'
import { fichaDeAli, secretoValido } from '@/lib/ali/juez'

export const dynamic = 'force-dynamic'

/**
 * La ficha completa de Ali (instrucciones + config aprobada en el CRM web),
 * para que el juez de la revisión semanal califique con lo mismo que lee Ali
 * (Fase 2, 20-11-2026). Solo con x-ia-secret = IA_SECRET.
 * GET → { version, texto }
 */
export async function GET(request: NextRequest) {
    if (!secretoValido(request.headers.get('x-ia-secret'))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    return NextResponse.json(await fichaDeAli())
}
