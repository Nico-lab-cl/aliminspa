import type { Metadata } from 'next'
import ChatPrueba from './ChatPrueba'

/**
 * Chat de prueba de Ali (16-11-2026). Para que el equipo y cualquiera con el
 * enlace converse con Ali y vea cómo responde, sin crear leads ni agendar de
 * verdad. Fuera de (main): sin navbar, footer ni el widget flotante.
 * No se indexa (robots + metadata).
 */
export const metadata: Metadata = {
    title: 'Probar a Ali',
    description: 'Conversa con Ali, el asistente virtual de Alimin, en modo prueba.',
    robots: { index: false, follow: false },
}

export default function ProbarAliPage() {
    return <ChatPrueba />
}
