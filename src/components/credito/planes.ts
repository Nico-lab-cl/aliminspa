import type { PlanCredito } from './calculo'

/**
 * Planes publicados de cada proyecto. Los usan la home, las páginas de
 * proyecto y el selector de /credito, así que un cambio de precio se hace acá
 * una sola vez.
 */

export const PLANES_LOMAS_DEL_MAR: PlanCredito[] = [
    { etiqueta: '200 m²', datos: { valorTotal: 37_990_000, pie: 5_500_000, dividendo: 550_000 } },
    { etiqueta: '390 m²', datos: { valorTotal: 45_990_000, pie: 7_500_000, dividendo: 550_000 } },
]

export const PLANES_ARENA_Y_SOL: PlanCredito[] = [
    { etiqueta: '200 m²', datos: { valorTotal: 42_000_000, pie: 20_000_000, dividendo: 500_000 } },
]

/** Proyectos que se pueden elegir en /credito, en el orden de los botones. */
export const PROYECTOS_CREDITO: { nombre: string; planes: PlanCredito[] }[] = [
    { nombre: 'Lomas del Mar', planes: PLANES_LOMAS_DEL_MAR },
    { nombre: 'Arena y Sol', planes: PLANES_ARENA_Y_SOL },
]
