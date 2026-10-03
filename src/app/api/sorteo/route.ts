import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Clave del panel del sorteo. Vive solo en la variable de entorno
 * SORTEO_ADMIN_KEY: antes había una clave por defecto escrita en el código,
 * visible en el repo y en el JavaScript del sitio. Sin la variable, nadie
 * puede escribir.
 */
const ADMIN_KEY = process.env.SORTEO_ADMIN_KEY

function claveValida(adminKey: unknown): boolean {
  return !!ADMIN_KEY && typeof adminKey === 'string' && adminKey === ADMIN_KEY
}

// GET: Retrieve the current sorteo state (public)
export async function GET() {
  try {
    const sorteo = await prisma.sorteo.findUnique({
      where: { id: 'current' },
    });

    if (!sorteo) {
      return NextResponse.json({
        participants: [],
        winners: [],
        status: 'pending',
      });
    }

    return NextResponse.json({
      participants: JSON.parse(sorteo.participants),
      winners: JSON.parse(sorteo.winners),
      status: sorteo.status,
    });
  } catch (error) {
    console.error('Sorteo GET error:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del sorteo' },
      { status: 500 }
    );
  }
}

// POST: Save sorteo data (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participants, winners, status, adminKey } = body;

    if (!claveValida(adminKey)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const sorteo = await prisma.sorteo.upsert({
      where: { id: 'current' },
      update: {
        participants: JSON.stringify(participants || []),
        winners: JSON.stringify(winners || []),
        status: status || 'pending',
      },
      create: {
        id: 'current',
        participants: JSON.stringify(participants || []),
        winners: JSON.stringify(winners || []),
        status: status || 'pending',
      },
    });

    return NextResponse.json({
      participants: JSON.parse(sorteo.participants),
      winners: JSON.parse(sorteo.winners),
      status: sorteo.status,
    });
  } catch (error) {
    console.error('Sorteo POST error:', error);
    return NextResponse.json(
      { error: 'Error al guardar datos del sorteo' },
      { status: 500 }
    );
  }
}
