/** Derechos de la Ley 21.719 que se pueden pedir desde /privacidad/derechos. */
export const DERECHOS = [
    { tipo: 'baja_comunicaciones', titulo: 'Dejar de recibir publicidad', detalle: 'No te volvemos a enviar correos ni mensajes con ofertas.' },
    { tipo: 'acceso', titulo: 'Saber qué datos tenemos', detalle: 'Te enviamos qué datos tuyos guardamos, para qué y con quién los compartimos.' },
    { tipo: 'rectificacion', titulo: 'Corregir mis datos', detalle: 'Actualizamos un dato que está mal o desactualizado.' },
    { tipo: 'supresion', titulo: 'Borrar mis datos', detalle: 'Eliminamos tus datos, salvo los que la ley nos obliga a guardar.' },
    { tipo: 'oposicion', titulo: 'Oponerme a un uso', detalle: 'Dejamos de usar tus datos para publicidad, perfiles o anuncios en redes.' },
    { tipo: 'portabilidad', titulo: 'Recibir una copia de mis datos', detalle: 'Te los enviamos en un formato que puedas llevar a otra empresa.' },
    { tipo: 'bloqueo', titulo: 'Bloquear mis datos', detalle: 'Suspendemos temporalmente su uso mientras se resuelve otra solicitud.' },
] as const

export type TipoDerecho = (typeof DERECHOS)[number]['tipo']

export const TIPOS_DERECHO: readonly string[] = DERECHOS.map((d) => d.tipo)
