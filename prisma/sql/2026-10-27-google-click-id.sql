-- Identificador del clic de Google Ads en cada lead (gclid, o gbraid/wbraid
-- en iPhone). Google Ads hoy solo cuenta los leads de quienes aceptan cookies
-- de marketing (unos 2 de cada 3); con el gclid guardado se le sube el resto
-- como conversión importada (ver /api/google-ads/conversiones).
--
-- El código ya tolera que este ALTER corra después del deploy (reintenta el
-- insert sin estas columnas), pero mientras no corra no se guarda el gclid.
--
-- Aplicar con:  psql "$DATABASE_URL" -f prisma/sql/2026-10-27-google-click-id.sql
-- Se puede correr más de una vez sin romper nada (IF NOT EXISTS).

BEGIN;

ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "gclid"  TEXT;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "gbraid" TEXT;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "wbraid" TEXT;

COMMIT;
