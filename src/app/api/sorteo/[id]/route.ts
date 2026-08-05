import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_KEY = process.env.SORTEO_ADMIN_KEY || 'alimin2026';

export type Estado = 'pending' | 'girando' | 'revelado' | 'finished';

export interface Ganador {
  puesto: number;
  username: string;
  comentario: string;
  fecha: string;
}

interface Blob {
  ganadores: Ganador[];
  /**
   * Salieron sorteados pero no estaban en el vivo para recibir el premio.
   * Se guardan para que no vuelvan a salir en el siguiente giro y para
   * dejar registro de por qué se volvió a girar.
   */
  descartados: Ganador[];
  girando: number | null;
  hash: string;
}

const vacio: Blob = { ganadores: [], descartados: [], girando: null, hash: '' };

function leerBlob(raw: string): Blob {
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) return { ...vacio, ganadores: [] }; // formato viejo
    return { ...vacio, ...v };
  } catch {
    return vacio;
  }
}

// El estado vive en un solo registro por sorteo. El overlay lo consulta cada 1.5s
// y el panel de control lo escribe: así el stream y los celulares ven lo mismo.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const sorteo = await prisma.sorteo.findUnique({ where: { id } });

    if (!sorteo) {
      return NextResponse.json({ participantes: [], ...vacio, status: 'pending' });
    }

    const blob = leerBlob(sorteo.winners);
    const participantes: string[] = JSON.parse(sorteo.participants || '[]');

    return NextResponse.json({
      participantes,
      total: participantes.length,
      ganadores: blob.ganadores,
      descartados: blob.descartados,
      girando: blob.girando,
      hash: blob.hash,
      status: sorteo.status as Estado,
      actualizado: sorteo.updatedAt,
    });
  } catch (error) {
    console.error(`Sorteo GET (${id}) error:`, error);
    return NextResponse.json({ error: 'Error al obtener el sorteo' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { participantes, ganadores, descartados, girando, hash, status, adminKey } = body;

    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const actual = await prisma.sorteo.findUnique({ where: { id } });
    const blobActual = actual ? leerBlob(actual.winners) : vacio;

    // Solo se sobrescribe lo que viene en el body: el panel puede mandar
    // parciales (ej. solo "girando") sin pisar la lista de ganadores.
    const blob: Blob = {
      ganadores: ganadores ?? blobActual.ganadores,
      descartados: descartados ?? blobActual.descartados,
      girando: girando !== undefined ? girando : blobActual.girando,
      hash: hash ?? blobActual.hash,
    };

    const listaParticipantes =
      participantes !== undefined
        ? JSON.stringify(participantes)
        : actual?.participants ?? '[]';

    const sorteo = await prisma.sorteo.upsert({
      where: { id },
      update: {
        participants: listaParticipantes,
        winners: JSON.stringify(blob),
        status: status ?? actual?.status ?? 'pending',
      },
      create: {
        id,
        participants: listaParticipantes,
        winners: JSON.stringify(blob),
        status: status ?? 'pending',
      },
    });

    return NextResponse.json({
      participantes: JSON.parse(sorteo.participants),
      total: JSON.parse(sorteo.participants).length,
      ...leerBlob(sorteo.winners),
      status: sorteo.status,
    });
  } catch (error) {
    console.error(`Sorteo POST (${id}) error:`, error);
    return NextResponse.json({ error: 'Error al guardar el sorteo' }, { status: 500 });
  }
}
