/**
 * Identificador del clic de Google Ads que llega con cada lead.
 *
 * Google agrega `gclid` a la URL de la landing (o `gbraid`/`wbraid` en iPhone).
 * El formulario lo manda junto con los datos y aquí se guarda, para subir a
 * Google Ads como conversión importada los leads de quienes no aceptaron
 * cookies de marketing: sin eso Google solo ve 2 de cada 3 leads y aprende a
 * pujar con datos incompletos. Ver /api/google-ads/conversiones.
 */

/** Los ids de Google son base64url; cualquier otra cosa en la URL se descarta. */
const ID_VALIDO = /^[A-Za-z0-9_-]{10,200}$/

function limpiar(v: unknown): string | null {
    return typeof v === 'string' && ID_VALIDO.test(v) ? v : null
}

export function idsDeClicGoogle(body: Record<string, unknown>) {
    return {
        gclid: limpiar(body.gclid),
        gbraid: limpiar(body.gbraid),
        wbraid: limpiar(body.wbraid),
    }
}
