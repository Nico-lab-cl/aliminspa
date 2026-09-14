# Tour virtual Arena y Sol — material descargado

Fuente: https://tour.panoee.net/arenaysol/68a920e6671c3e138277f1ef
Descargado el 2026-09-12. Total: 153 MB.

## Qué hay (y qué no)

El tour **no tiene archivos de plano subidos**. El plugin `floorplan` de Panoee está
vacío y el plugin `map` está desactivado. Lo que se ve como "plano del loteo" son dos
cosas superpuestas sobre la foto aérea 360:

1. Las **líneas de deslinde marcadas en el terreno mismo**, visibles en la panorámica.
2. Los **polígonos de lotes** que dibuja el visor encima (rojo = vendido, verde = disponible).

Ambas quedaron capturadas aquí.

## panoramicas-360/

Tres escenas. Los JPG originales del CDN (19–61 MB) están en S3 Deep Archive y
devuelven 403, así que se reconstruyeron desde los tiles cúbicos de krpano que sí
sirve el visor — es la misma imagen que ves en el tour, a su resolución máxima.

Por cada escena:

- `*_equirectangular_*.jpg` — la panorámica 360 completa, lista para cualquier visor
  (Panoee, krpano, Marzipano, Facebook 360, Google VR).
- `*_equirect_CON-LOTES.jpg` — lo mismo con los polígonos de lotes renderizados encima,
  tal como se ven en el tour.
- `caras-cubo/` — las 6 caras del cubo a resolución nativa. **`d_suelo-NADIR.jpg` es la
  vista cenital**: un plano aéreo del loteo mirando directo hacia abajo, con los
  deslindes del terreno visibles. Es lo más parecido a un plano que existe en el tour.

| Escena | Cara cubo | Equirectangular |
|---|---|---|
| 01 entrada terreno | 2816 px | 5632 × 2816 |
| 02 Vista 2 | 6400 px | 12800 × 6400 |
| 03 Vista 1 | 6400 px | 12800 × 6400 |

La escena 01 se publicó a menor resolución en el tour; no hay nivel más alto disponible.

## lotes-poligonos.json

Los 108 polígonos de lotes con sus vértices y color:

- Vista 2 → 60 polígonos
- Vista 1 → 48 polígonos
- 46 verdes (disponibles), 60 rojos (vendidos), 2 sin color definido

Coordenadas en ángulos esféricos de krpano: `ath` = azimut (−180..180), `atv` = vertical
**positivo hacia abajo**. Para pasarlos a píxeles de la equirectangular:

    x = (ath + 180) / 360 * ancho
    y = (90 + atv) / 180 * alto

Ojo al dibujarlos: las aristas son arcos de círculo máximo, no rectas en el plano
equirectangular. Hay que interpolar esféricamente entre vértices (así se generaron los
`_CON-LOTES.jpg`), si no los lotes salen deformados.

Los polígonos son geometría del visor, no superficies de escritura — no sirven para
deducir m² de los lotes.

## graficos-del-tour/

`portada_tour.png` (imagen social 1200×628), `logo_aliminspa.png`, `favicon.webp`,
los 3 íconos de hotspot y `sticker_ilustracion.png` (el sticker de la carita, no es un plano).

## Verlo en el navegador

    node tour-arenaysol/serve.js

Y abrir http://localhost:8099 — galería con todas las imágenes, botón "Ver en 360°"
para las equirectangulares y enlace al archivo original de cada una. En el proyecto
está también como configuración `planos` en `.claude/launch.json`.

Las miniaturas y las versiones de pantalla viven en `_web/` (generadas, se pueden
borrar y regenerar). Los archivos a resolución completa están en `panoramicas-360/`.

## Qué se hizo con esto

De acá salió el mapa de lotes de `/proyectos/arena-y-sol/agendar-visita`, que
reusa el mismo visor que Lomas del Mar. Lo genera
`scripts/importar-plano-arenaysol.js` y escribe en `public/arenaysol3d/`.

El script rectifica las dos panorámicas sobre el plano del suelo —terreno plano
supuesto— para obtener una vista cenital de verdad, y las fusiona: cada zona del
plano sale de la escena que la mira más de frente, así ninguna punta queda
estirada. Como el tour no dice ni el giro ni la altura de cada vuelo, las
escenas se registran haciendo calzar los lotes que ambas ven (43 de 48
coinciden, con error mediano del 19% del lado de un lote).

Resultado: 65 lotes. 17 los ve solo Vista 2, 43 las dos, 5 solo Vista 1.

Dos cosas que el tour no da y que el script no inventa: los **números de lote**
(pone un orden provisional por posición, y la página muestra una referencia
`AS-nn` en vez de un número de escritura) y las **superficies** (`area` va en
null; la escala en metros dependería de dos chinches puestas a mano en Panoee y
da ~380 m² donde el proyecto vende de 200).

Hay **4 lotes donde las dos escenas se contradicen** sobre si están vendidos.
Gana la edición más reciente del polígono. Salen marcados con `conflicto: true`
en `public/arenaysol3d/plano-lotes.json`.
