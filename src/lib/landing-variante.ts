/**
 * Variante de una landing pública para tráfico pagado (las rutas /google/*).
 *
 * La página es la misma que la pública; solo cambia el H1, para que repita la
 * palabra clave del grupo de anuncios, y cómo se etiqueta el lead. Sin variante,
 * la página se ve y mide exactamente como siempre.
 */
export interface VarianteLanding {
    /** H1 en dos partes: la segunda va resaltada en verde, como en la página original. */
    h1: { texto: string; destacado: string }
    /** Se agrega al proyecto del lead en el CRM, p. ej. " - Google". */
    sufijoLead: string
    /** UTM por defecto cuando la URL no trae las suyas. */
    utm: { utm_source: string; utm_medium: string; utm_campaign: string }
}

/** UTM de la campaña de Búsqueda "Busqueda | Terrenos Litoral Central | 06-10-26". */
export const UTM_GOOGLE_BUSQUEDA = {
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'busqueda_terrenos_litoral_central',
}
