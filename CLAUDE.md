# Alimin SpA — rama `alimin-diseño-chris`

## Objetivo de este repositorio

En esta rama **solo se trabaja el front-end**, y el único objetivo es que el sitio sea **responsivo** (móvil, tablet y escritorio). Todo cambio debe servir a ese objetivo.

## Qué SÍ se puede tocar

- Estilos: `src/app/globals.css`, `src/styles/`, archivos `*.module.css` y clases/estilos en línea de los componentes.
- Maquetación (JSX/HTML) de componentes visuales en `src/components/` (`layout/`, `sections/`, `ui/`, etc.) y de las páginas en `src/app/**/page.tsx`, **solo en lo visual**: estructura de contenedores, grillas, breakpoints, tamaños, espaciados, orden visual, menús móviles, imágenes responsivas.

## Qué NO se puede tocar (prohibido)

1. **SEO** — nada que afecte posicionamiento:
   - `metadata` / `generateMetadata`, títulos, descripciones, Open Graph, canonical, `alt` existentes, etiquetas de encabezado (`h1`, `h2`…) ni su texto.
   - `src/app/robots.ts`, `src/app/sitemap.ts`, `src/components/seo/`, datos estructurados (JSON-LD).
   - Rutas y URLs (no renombrar, mover ni borrar carpetas de `src/app/`), redirecciones en `next.config.ts`.
   - Textos de contenido indexable (no reescribir copys).
2. **Scripts** — nada de tracking ni scripts de terceros o del proyecto:
   - `src/components/analytics/`, `src/components/consent/`, etiquetas `<Script>`, píxeles (Meta, Google Ads, Clarity, GTM), `src/lib/track.ts`, `src/lib/meta-capi.ts`, `src/lib/google-ads-*.ts`, `src/lib/consent*.ts`.
   - Scripts sueltos de la raíz (`fix.js`, `make_icon.js`, `optimize.js`, `replace.js`) y la carpeta `scripts/`.
   - `scripts` de `package.json`.
3. **Servidor / backend** — nada que se ejecute en el servidor:
   - `src/app/api/` (rutas API), `middleware.ts`, Server Actions, `src/lib/` (Prisma, CRM, Google Calendar, chat Ali, rate limit, disponibilidad, etc.).
   - `prisma/`, `prisma.config.ts`, `next.config.ts`, `Dockerfile`, `.env*`.
   - Dependencias: no agregar, quitar ni actualizar paquetes (`package.json`, `package-lock.json`).
   - Lógica de datos en componentes (fetch, llamadas a API, `"use server"`, manejo de formularios y su envío).

Si un cambio responsivo parece requerir tocar algo de la lista prohibida, **detenerse y preguntar** antes de hacerlo.

## Desarrollo local

Node no está en el PATH por defecto en esta Mac; anteponer:

```bash
export PATH=~/.local/bin:~/.local/node/bin:$PATH
```

Luego `npm install` y `npm run dev` → http://localhost:3000.
Revisar cada cambio en anchos de 375 px (móvil), 768 px (tablet) y escritorio.
