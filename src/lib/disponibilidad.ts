/**
 * Cuántos lotes siguen disponibles en un proyecto.
 *
 * El número sale del mismo archivo que pinta el mapa (`plano-lotes.json`), no
 * de una cifra escrita a mano: si el equipo marca un lote como vendido en el
 * plano, la portada de /reunion lo refleja sin que nadie toque el copy.
 *
 * El conteo repite la regla de `plano-lotes.js`: solo entran los lotes con
 * número —los otros polígonos son áreas verdes, estacionamientos o sanitarios—
 * y se cuentan los que no están vendidos. Si el archivo no se puede leer
 * devuelve null, y la pantalla simplemente no muestra el contador.
 */

import { promises as fs } from 'fs'
import path from 'path'

interface LotePlano {
    n?: number | null
    sold?: boolean
    tipo?: string
}

export async function contarDisponibles(archivoPublico: string): Promise<number | null> {
    try {
        const ruta = path.join(process.cwd(), 'public', archivoPublico)
        const datos = JSON.parse(await fs.readFile(ruta, 'utf8')) as { lotes?: LotePlano[] }
        const lotes = datos.lotes ?? []
        const conNumero = lotes.filter((l) => l.n != null)
        const enVenta = conNumero.length ? conNumero : lotes
        if (!enVenta.length) return null
        return enVenta.filter((l) => !l.sold).length
    } catch {
        return null
    }
}
