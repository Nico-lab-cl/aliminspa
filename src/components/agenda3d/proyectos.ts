/**
 * Qué cambia de un proyecto a otro en el mapa 3D.
 *
 * El recorrido —elegir lote, fecha, datos, confirmación— es el mismo para
 * todos, así que Agenda3D es uno solo y lo que varía viaja en esta tabla: qué
 * archivos carga el visor, cómo se llama el proyecto en la base y en los
 * eventos, dónde queda y qué videos de ambiente tiene.
 *
 * Lomas del Mar es el que ya estaba y queda igual. Arena y Sol se suma con el
 * plano sacado del tour de Panoee.
 */

export interface Proyecto {
    /** Slug interno. No se muestra. */
    id: string
    /** Nombre con que se guarda la visita y viaja a los eventos de Meta. */
    nombre: string
    /** Cómo se lee en la barra del mapa. */
    rotulo: string
    /** Única modalidad que ofrece el equipo para este proyecto. */
    modalidad: string
    /** Comuna, para la barra y la confirmación. */
    comuna: string
    /** Una línea bajo el mapa de Google. */
    ubicacionPie: string
    mapaEmbed: string
    mapaLugar: string
    /** Los tres archivos que come el visor `<plano-lotes>`. */
    plano: { alta: string; baja: string; mapa: string; lotes: string }
    /**
     * El mismo plano girado un cuarto de vuelta, para pantallas más altas que
     * anchas.
     *
     * Solo hace falta cuando el loteo es una franja alargada: derecha no entra
     * en un teléfono en vertical y el visitante termina viendo unos pocos
     * lotes. Sin esto la página usa siempre `plano`, que es lo que quiere un
     * loteo compacto como Lomas del Mar.
     */
    planoVertical?: { alta: string; baja: string; mapa: string; lotes: string }
    /**
     * Si todos los lotes tienen número de escritura y se muestran como "Lote 12".
     *
     * Arena y Sol no: su plano de ventas rotula solo los disponibles (P61,
     * P9...) y los vendidos van sin número. Con false la página nombra el lote
     * con `refPrefijo` y no escribe números sobre el plano, que ya los trae
     * dibujados. Ver scripts/importar-plano-arenaysol-ilustrado.js.
     */
    numeraLotes: boolean
    /**
     * Cómo se nombra un lote cuando `numeraLotes` es false: el prefijo va
     * pegado al número, así que lleva su propio separador si lo necesita
     * (`P` da "P61"). Por defecto "Ref-".
     */
    refPrefijo?: string
    /** Qué entradas del glosario de colores aplican. Los nombres salen de GLOSARIO en Agenda3D. */
    glosario: string[]
    /**
     * Cuánto aire deja la vista inicial alrededor de los lotes. 1 es justo la
     * caja de los lotes; por omisión el visor usa 1.14.
     */
    aire?: number
    /** Si los lotes están repartidos en etapas. */
    tieneEtapas: boolean
    /** Video de ambiente al elegir el lote. Opcional. */
    llegada?: { escritorio: string; movil: string; poster: string }
    /** Video de la casa tipo, en el panel del lote. Opcional. */
    casa?: { escritorio: string; movil: string; poster: string }
}

export const LOMAS_DEL_MAR: Proyecto = {
    id: 'lomas-del-mar',
    nombre: 'Lomas del Mar',
    rotulo: 'LOMAS DEL MAR',
    modalidad: 'Visita en terreno, El Tabo',
    comuna: 'El Tabo',
    ubicacionPie: 'El Tabo, Litoral Central · a 10 min de la playa y 1 hora de Santiago',
    mapaEmbed:
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3328.7!2d-71.6181184!3d-33.4617574!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x966215007f8800b9%3A0x952d8553bda618e5!2sLomas%20Del%20Mar%20-%20Alimin!5e1!3m2!1ses!2scl!4v1719000000000',
    mapaLugar:
        'https://www.google.com/maps/place/Lomas+Del+Mar+-+Alimin/@-33.4617529,-71.6184652,907m/data=!3m2!1e3!4b1',
    plano: {
        alta: '/lomas3d/plano.webp',
        baja: '/lomas3d/plano-lite.webp',
        mapa: '/lomas3d/plano-mapa.png',
        lotes: '/lomas3d/plano-lotes.json',
    },
    numeraLotes: true,
    glosario: ['Disponible', 'Vendido', 'Área verde', 'Estacionamiento', 'Equip. sanitario'],
    tieneEtapas: true,
    llegada: {
        escritorio: '/lomas3d/construccion/llegada-lote.mp4',
        movil: '/lomas3d/construccion/llegada-lote-movil.mp4',
        poster: '/lomas3d/construccion/llegada-lote-poster.webp',
    },
    casa: {
        escritorio: '/lomas3d/construccion/casa-200m2.mp4',
        movil: '/lomas3d/construccion/casa-200m2-movil.mp4',
        poster: '/lomas3d/construccion/casa-200m2-poster.webp',
    },
}

export const ARENA_Y_SOL: Proyecto = {
    id: 'arena-y-sol',
    nombre: 'Arena y Sol',
    rotulo: 'ARENA Y SOL',
    modalidad: 'Visita en terreno, El Tabo',
    comuna: 'El Tabo',
    ubicacionPie: 'El Tabo, Litoral Central · a 10 min de la playa del Tabo',
    // La ficha real del loteo en Google, no unas coordenadas sueltas: así el
    // visitante ve el nombre y puede abrir la ruta desde ahí.
    mapaEmbed:
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3328.7!2d-71.6290669!3d-33.4347434!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x96621500467b67e5%3A0x82414c1c5c44ed77!2sArena%20y%20Sol%20-%20Alimin%20SPA!5e1!3m2!1ses!2scl!4v1719000000000',
    mapaLugar:
        'https://www.google.com/maps/place/Arena+y+Sol+-+Alimin+SPA/@-33.43399,-71.62968,907m/data=!3m1!1e3',
    plano: {
        alta: '/arenaysol3d/plano.webp',
        baja: '/arenaysol3d/plano-lite.webp',
        mapa: '/arenaysol3d/plano-mapa.png',
        lotes: '/arenaysol3d/plano-lotes.json',
    },
    planoVertical: {
        alta: '/arenaysol3d/plano-vertical.webp',
        baja: '/arenaysol3d/plano-vertical-lite.webp',
        mapa: '/arenaysol3d/plano-mapa-vertical.png',
        lotes: '/arenaysol3d/plano-lotes-vertical.json',
    },
    numeraLotes: false,
    // Como en el plano de ventas: P61, P9...
    refPrefijo: 'P',
    // Solo los colores que el plano pinta: no hay áreas verdes ni
    // estacionamiento marcados, y un glosario con colores ausentes confunde.
    glosario: ['Disponible', 'Vendido', 'Equip. sanitario'],
    // El loteo es una franja angosta rodeada de casas y camino: con el
    // encuadre justo se lee como un recorte, y no se entiende donde esta.
    aire: 1.5,
    tieneEtapas: false,
}

export const PROYECTOS: Record<string, Proyecto> = {
    [LOMAS_DEL_MAR.id]: LOMAS_DEL_MAR,
    [ARENA_Y_SOL.id]: ARENA_Y_SOL,
}
