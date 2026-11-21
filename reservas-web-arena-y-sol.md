# Reserva en línea de Arena y Sol (Webpay) + Ali la ofrece — 21-11-2026

## Cómo funciona

1. Ali (WhatsApp, IG, FB o chat web) detecta que la persona está por reservar. En **un mensaje breve** le cuenta los lotes libres, las condiciones (reserva de $550.000 que no se devuelve, 10 días corridos para pie y promesa) y los beneficios (visitar cuando quiera, contrato de compraventa después de la reserva, un asesor la contacta y acceso al portal de pagos).
2. Cuando elige el lote, Ali usa `link_reserva` y manda `aliminspa.cl/reservar/arena-y-sol?lote=P45&origen=ali-whatsapp`.
3. En la página, la persona confirma el lote, deja nombre, RUT, correo y celular, acepta las condiciones y paga con **Webpay**. El lote queda apartado 15 minutos mientras paga.
4. Con el pago aprobado (`/api/reservas/commit`):
   - **Correo al cliente** desde la casilla de postventa de Arena y Sol (n8n, buzón "cindy" = postventa@lomasdelmar.cl), con el comprobante y los pasos que siguen.
   - **Correo a postventa** (`RESERVA_AVISO_CORREO`, por defecto postventa@lomasdelmar.cl) con todos los datos para el contrato.
   - **CRM** (`POST /api/reservas/web`): el lead queda en `RESERVA_PAGADA` con el lote. Si no tenía asesor (o lo tenía Ali), se le asigna uno de la rueda; fuera del horario de la rueda, uno al azar. Le llega un push al asesor y se publica un **mensaje grande en el grupo de leads** (sin teléfono ni correo).
   - Compra (Purchase) a Meta, solo si la persona aceptó cookies de marketing.
5. El lote deja de ofrecerse en la página y en `lotes_disponibles` de Ali. **Postventa tiene que marcarlo como vendido en el plano** (`public/arenaysol3d/plano-lotes*.json`) para que el mapa 3D también lo muestre vendido.

Lomas del Mar: Ali manda `aliminlomasdelmar.com`, donde se elige el lote en el mapa y se paga como siempre (sus correos de n8n no cambian).

## Qué cambió

| Repo | Archivos |
|---|---|
| aliminspa-main (v2-web) | `src/lib/transbank.ts`, `src/lib/reservas.ts`, `src/lib/reservas-avisos.ts`, `src/app/api/reservas/route.ts`, `src/app/api/reservas/commit/route.ts`, `src/app/reservar/**`, `prisma/schema.prisma` (ReservaWeb), `prisma/sql/2026-11-21-reservas-web.sql`, `src/lib/ali/herramientas.ts` (link_reserva), `src/lib/ali/conocimiento.ts` e `intencion.ts` (reglas), `package.json` (transbank-sdk) |
| CRM-Alimin (v2-crm) | `src/app/api/reservas/web/route.ts` |

## Para salir a producción (en este orden)

1. **Base de datos del sitio**: correr `prisma/sql/2026-11-21-reservas-web.sql` en la base `aliminspa` (solo crea la tabla `reservas_web`; se puede correr dos veces).
2. **EasyPanel → app aliminspa → variables** (las claves las pega Nico):
   - `TBK_ENV=production`, `TBK_API_KEY_ID` y `TBK_API_KEY_SECRET`: las mismas de aliminlomasdelmar.com.
   - `N8N_EMAIL_WEBHOOK_URL`, `N8N_EMAIL_WEBHOOK_AUTH_HEADER` y `N8N_EMAIL_WEBHOOK_AUTH_VALUE`: las mismas del portal de pagos.
   - `RESERVA_AVISO_CORREO`: a quién le llega el aviso de postventa (opcional; por defecto postventa@lomasdelmar.cl).
   - `CRM_API_KEY` ya existe (es la de los leads).
3. Desplegar **CRM-Alimin** (v2-crm) **antes** que el sitio, para que el endpoint `/api/reservas/web` ya exista.
4. Desplegar el sitio (v2-web).
5. Probar con una reserva real de un lote y anularla (o devolverla en Transbank), o dejar `TBK_ENV` vacío un rato: el ambiente de integración no cobra y acepta solo tarjetas de prueba.

Sin `TBK_ENV=production` la página funciona contra el ambiente de integración de Transbank (no cobra). Sin las variables de n8n la reserva igual se paga y el CRM se entera, pero no salen los correos (queda en el log).
