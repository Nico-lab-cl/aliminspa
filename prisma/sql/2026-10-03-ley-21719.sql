-- Ley 21.719 (vigente desde el 1 de diciembre de 2026): prueba del
-- consentimiento en leads, visitas y newsletter, y tabla de solicitudes de
-- derechos (/privacidad/derechos).
--
-- Todas las columnas nuevas son nullable: las filas anteriores a octubre de
-- 2026 no registraban el consentimiento y no hay cómo inventarlo después.
-- El código ya tolera que este ALTER corra después del deploy (reintenta el
-- insert sin estas columnas), pero mientras no corra no se guarda la prueba
-- y /api/derechos falla, así que conviene correrlo ANTES de publicar.
--
-- Aplicar con:  psql "$DATABASE_URL" -f prisma/sql/2026-10-03-ley-21719.sql
-- Se puede correr más de una vez sin romper nada (IF NOT EXISTS).

BEGIN;

-- ── Leads ─────────────────────────────────────────────────────────
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "consentimiento_contacto"  BOOLEAN;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "consentimiento_marketing" BOOLEAN;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "consentimiento_at"        TIMESTAMP(3);
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "politica_version"         TEXT;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "consentimiento_origen"    TEXT;

-- ── Visitas agendadas ─────────────────────────────────────────────
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "consentimiento_contacto"  BOOLEAN;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "consentimiento_marketing" BOOLEAN;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "consentimiento_at"        TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "politica_version"         TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "consentimiento_origen"    TEXT;

-- ── Newsletter ────────────────────────────────────────────────────
ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "consentimiento_at"     TIMESTAMP(3);
ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "politica_version"      TEXT;
ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "consentimiento_origen" TEXT;
ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "baja_at"               TIMESTAMP(3);

-- ── Solicitudes de derechos ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "solicitudes_derechos" (
    "id"            TEXT         NOT NULL,
    "tipo"          TEXT         NOT NULL,
    "nombre"        TEXT         NOT NULL,
    "email"         TEXT         NOT NULL,
    "celular"       TEXT,
    "detalle"       TEXT,
    "estado"        TEXT         NOT NULL DEFAULT 'pendiente',
    "vence_el"      TIMESTAMP(3) NOT NULL,
    "respuesta"     TEXT,
    "respondida_at" TIMESTAMP(3),
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "solicitudes_derechos_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "solicitudes_derechos_estado_idx" ON "solicitudes_derechos" ("estado");
CREATE INDEX IF NOT EXISTS "solicitudes_derechos_email_idx"  ON "solicitudes_derechos" ("email");

COMMIT;


-- ═════════════════════════════════════════════════════════════════
-- Consultas de operación (NO se ejecutan con el -f de arriba si se
-- copian aparte; están comentadas para que el archivo sea seguro).
-- ═════════════════════════════════════════════════════════════════

-- 1. Solicitudes de derechos abiertas, la más urgente primero:
-- SELECT id, tipo, nombre, email, estado, created_at, vence_el,
--        vence_el - NOW() AS queda
--   FROM solicitudes_derechos
--  WHERE estado IN ('pendiente', 'en_proceso')
--  ORDER BY vence_el;

-- 2. Marcar una solicitud como respondida:
-- UPDATE solicitudes_derechos
--    SET estado = 'respondida', respuesta = 'Texto de lo que se respondió', respondida_at = NOW()
--  WHERE id = 'ID_DE_LA_SOLICITUD';

-- 3. Acceso / portabilidad: todo lo que el sitio guarda de un correo.
-- SELECT 'lead' AS origen, id, nombre, email, celular, ciudad, proyecto, created_at FROM leads    WHERE LOWER(email) = LOWER('persona@correo.cl')
-- UNION ALL
-- SELECT 'visita', id, nombre, email, celular, NULL, proyecto, created_at             FROM bookings WHERE LOWER(email) = LOWER('persona@correo.cl')
-- UNION ALL
-- SELECT 'newsletter', id, NULL, email, NULL, NULL, NULL, created_at                  FROM newsletter_subscribers WHERE LOWER(email) = LOWER('persona@correo.cl');

-- 4. Supresión: borrar a una persona del sitio (verificar identidad antes;
--    después hay que borrarla también del CRM y de las audiencias de Meta).
-- BEGIN;
-- DELETE FROM leads                  WHERE LOWER(email) = LOWER('persona@correo.cl');
-- DELETE FROM bookings               WHERE LOWER(email) = LOWER('persona@correo.cl');
-- DELETE FROM newsletter_subscribers WHERE LOWER(email) = LOWER('persona@correo.cl');
-- COMMIT;

-- 5. Quiénes se pueden usar para publicidad / audiencias de Meta
--    (aceptaron marketing explícitamente y no se dieron de baja):
-- SELECT DISTINCT LOWER(email) AS email, celular
--   FROM leads
--  WHERE consentimiento_marketing = TRUE
--    AND LOWER(email) NOT IN (SELECT LOWER(email) FROM solicitudes_derechos
--                              WHERE tipo IN ('baja_comunicaciones', 'oposicion', 'supresion'));

-- 6. Plazos de conservación (los de /politica-de-privacidad, sección 6).
--    Revisar primero con SELECT COUNT(*) en vez de DELETE. No borra a quienes
--    compraron: esos viven en el CRM y en los contratos, no en estas tablas.
--    La tabla leads no sabe del último contacto (eso vive en el CRM): se usa
--    la fecha de creación, y se salta a quien volvió a escribir hace menos.
-- DELETE FROM leads l
--  WHERE l.created_at < NOW() - INTERVAL '24 months'
--    AND NOT EXISTS (SELECT 1 FROM leads r WHERE LOWER(r.email) = LOWER(l.email)
--                                          AND r.created_at >= NOW() - INTERVAL '24 months');
-- DELETE FROM bookings WHERE fecha < NOW() - INTERVAL '24 months';
--    Las bajas del newsletter NO se borran: son la lista de a quién no
--    volver a escribir si su correo reaparece en una importación.
