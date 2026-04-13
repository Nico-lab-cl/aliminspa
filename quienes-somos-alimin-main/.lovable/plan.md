

# Rediseno Premium - Pagina "Quienes Somos" de Alimin SpA

## Analisis del sitio actual

**Marca extraida:**
- Fondo principal: verde oscuro (#1B3A2D aprox.) con matices azulados
- Acento dorado/gold: usado en logo, lineas decorativas y labels (#C9A84C aprox.)
- Tipografia: sans-serif moderna (probablemente Poppins o similar)
- Logo: simbolo triangular dorado + "ALIMIN" en dorado
- Nav: Inicio, Proyectos, Beneficios, Ubicacion, Quienes Somos + boton "Contacto" con borde dorado

**Problemas actuales identificados:**
- Video de fondo con YouTube roto/no carga bien
- Tarjetas de Mision/Vision flotando sin contexto sobre el video
- Falta hero propio para la pagina
- Tarjetas del equipo sin jerarquia clara entre directores y asesores
- Sin animaciones de entrada
- Footer generico
- Espaciado inconsistente

**Contenido a preservar (exacto):**
- Mision y Vision (textos completos)
- "Nuestro Equipo" / "Las personas que construyen contigo"
- Subtitulo: "Un equipo humano, profesional y comprometido con tu futuro"
- Parrafo introductorio del equipo
- Direccion: Patricio Escobar (CEO) + Marcela Lopez (CEO) con descripciones
- Asesores: Marcela Escobar, Barbara Arias, Orlando Costa con cargos, descripciones y links WhatsApp
- Newsletter: "Recibe las mejores oportunidades de terrenos" + subtitulo
- Fotos originales desde aliminspa.cl

---

## Plan de implementacion

### 1. Configurar colores de marca y tipografia en CSS

Actualizar `src/index.css` con variables CSS de Alimin:
- `--alimin-green`: verde oscuro principal (~195 40% 18%)
- `--alimin-gold`: dorado marca (~43 50% 54%)
- `--alimin-cream`: fondo claro (~40 30% 97%)
- Importar Google Font Poppins (o la que use el sitio)

### 2. Crear componentes modulares

Archivos nuevos en `src/components/`:

- **Header.tsx** — Nav sticky con blur al scroll. Logo Alimin (imagen desde su sitio). Links de navegacion. Boton "Contacto" con borde dorado y hover elegante.

- **HeroSection.tsx** — Fondo verde oscuro con gradiente sutil. Titulo "Nuestro Equipo" grande y elegante. Subtitulo "Las personas que construyen contigo". Linea decorativa dorada. Fade-in animations.

- **MisionVision.tsx** — Fondo crema/blanco. Grid de 2 columnas con tarjetas de Mision y Vision. Icono sutil o linea dorada como acento. Sombras suaves, bordes redondeados, mejor padding y tipografia.

- **TeamIntro.tsx** — Seccion con label "NUESTRO EQUIPO", titulo editorial grande, parrafo introductorio. Separador decorativo dorado. Fondo con gradiente sutil.

- **DirectionSection.tsx** — 2 tarjetas premium grandes para Patricio y Marcela Lopez. Foto circular grande, nombre, cargo, descripcion. Layout 2 columnas desktop, apilado mobile. Estilo corporativo sobrio.

- **AdvisorsSection.tsx** — Grid 3 columnas (desktop), 2 (tablet), 1 (mobile). Tarjetas con imagen, nombre, cargo, descripcion, boton "Contactame" con icono WhatsApp. Hover con elevacion sutil.

- **NewsletterCTA.tsx** — Fondo verde oscuro. Titulo y subtitulo centrados. Input + boton "Suscribirme" en linea. Estilo premium y limpio.

- **Footer.tsx** — Fondo verde muy oscuro. Logo, links, redes sociales. Columnas bien distribuidas. Copyright.

### 3. Pagina principal (`src/pages/Index.tsx`)

Componer todos los componentes en orden:
Header > Hero > MisionVision > TeamIntro > DirectionSection > AdvisorsSection > NewsletterCTA > Footer

### 4. Animaciones

Usar CSS `@keyframes` + Intersection Observer (o una libreria ligera) para:
- Fade-up en titulos y tarjetas al entrar en viewport
- Hover con sombra y ligera elevacion en tarjetas
- Transicion suave del header al hacer scroll

### 5. Responsive

- Breakpoints: mobile (<640px), tablet (640-1024px), desktop (>1024px)
- Padding lateral generoso en mobile
- Tarjetas apiladas correctamente
- Tipografia escalada apropiadamente

---

## Detalle tecnico

- **Imagenes**: Se usaran las URLs originales del sitio (aliminspa.cl) para fotos del equipo y logo
- **Fuentes**: Se importara la fuente del sitio original via Google Fonts en `index.html`
- **Animaciones**: CSS puro con clase `.animate-fade-up` activada via IntersectionObserver en un hook custom `useScrollReveal`
- **No se requiere backend** ni Supabase para esta pagina estatica
- **Total ~9 archivos** a crear/modificar

