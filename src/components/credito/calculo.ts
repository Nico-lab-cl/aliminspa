/**
 * Calculadora de cuotas de Alimin, igual a la planilla que usa el equipo
 * comercial ("Calculadora de cuotas Alimin.xlsx"). La planilla tiene tres
 * celdas que se llenan a mano —valor total del terreno, pie y valor del
 * dividendo— y una sola calculada:
 *
 *     Número de dividendos = (Valor total − Pie) / Valor dividendo
 *
 * Sin interés ni reajuste, y sin redondear: la planilla muestra dos decimales
 * (39,15) y acá se muestra lo mismo. Si el negocio cambia la planilla, se
 * cambia esto; no se le agregan modos ni campos por cuenta propia.
 */

export interface DatosCredito {
    valorTotal: number
    pie: number
    dividendo: number
}

/**
 * Plan de un terreno puntual (p. ej. Lomas del Mar 200 m²). Cuando un proyecto
 * tiene más de un tamaño, cada uno parte con su propio pie: elegir el tamaño
 * solo carga los montos; la cuenta sigue siendo la de la planilla.
 */
export interface PlanCredito {
    /** Texto del botón y de la etiqueta del lead, p. ej. "200 m²". */
    etiqueta: string
    datos: DatosCredito
}

/** Valores de ejemplo con los que viene la planilla. */
export const VALORES_PLANILLA: DatosCredito = {
    valorTotal: 38_490_000,
    pie: 15_000_000,
    dividendo: 600_000,
}

/**
 * Número de dividendos, o null si con esos datos no hay cálculo que mostrar:
 * sin dividendo la planilla da #DIV/0!, y con un pie igual o mayor al total no
 * queda saldo que pagar en cuotas.
 */
export function numeroDeDividendos({ valorTotal, pie, dividendo }: DatosCredito): number | null {
    if (!(dividendo > 0) || !(valorTotal > 0)) return null
    const saldo = valorTotal - pie
    if (!(saldo > 0)) return null
    return saldo / dividendo
}

export const formatoPesos = (n: number) => '$' + Math.round(n).toLocaleString('es-CL')

/** Mismo formato de la celda de la planilla: dos decimales, coma decimal. */
export const formatoDividendos = (n: number) =>
    n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * Lo que va en la columna `proyecto` del lead. El asesor lo lee en la ficha del
 * CRM, así que lleva los cuatro datos de la planilla tal cual los vio la
 * persona, más dónde usó la calculadora.
 */
export function etiquetaLead(datos: DatosCredito, origen?: string): string {
    const n = numeroDeDividendos(datos)
    return [
        'Crédito' + (origen ? ` - ${origen}` : ''),
        `Terreno ${formatoPesos(datos.valorTotal)}`,
        `Pie ${formatoPesos(datos.pie)}`,
        `Dividendo ${formatoPesos(datos.dividendo)}`,
        n === null ? 'sin cálculo' : `${formatoDividendos(n)} dividendos`,
    ].join(' | ')
}
