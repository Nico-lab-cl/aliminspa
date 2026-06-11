import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_KEY = 'alimin2026';

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

    if (adminKey !== ADMIN_KEY) {
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
