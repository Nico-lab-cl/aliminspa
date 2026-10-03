/**
 * Límite de pedidos por IP, en memoria.
 *
 * Alcanza para frenar a un script que martilla un endpoint público (mandar
 * eventos falsos a Meta a nombre de Alimin, llenar la base de leads basura).
 * Vive en la memoria de cada proceso: si algún día hay varias réplicas, cada
 * una cuenta por su lado, que sigue siendo mejor que nada.
 */

const ventanas = new Map<string, number[]>()
let ultimaLimpieza = Date.now()

/** true si el pedido entra; false si la IP ya gastó su cupo en la ventana. */
export function dentroDelLimite(clave: string, maximo: number, ventanaMs: number): boolean {
    const ahora = Date.now()

    // Cada cierto rato se botan las IPs que ya no tienen pedidos recientes,
    // para que el Map no crezca sin fin.
    if (ahora - ultimaLimpieza > 10 * 60 * 1000) {
        for (const [k, marcas] of ventanas) {
            if (!marcas.length || ahora - marcas[marcas.length - 1] > 60 * 60 * 1000) ventanas.delete(k)
        }
        ultimaLimpieza = ahora
    }

    const recientes = (ventanas.get(clave) || []).filter((t) => ahora - t < ventanaMs)
    if (recientes.length >= maximo) {
        ventanas.set(clave, recientes)
        return false
    }
    recientes.push(ahora)
    ventanas.set(clave, recientes)
    return true
}
