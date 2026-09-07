-- Campos que agrega el agendamiento 3D (/agendar-visita).
--
-- Ambos son nullable a propósito: las visitas que llegan por /reunion se
-- agendan sin elegir un lote, y las filas anteriores a este cambio tampoco
-- tienen el dato. Por eso el ALTER no necesita default ni backfill.
--
-- Aplicar con:  psql "$DATABASE_URL" -f prisma/sql/2026-09-07-booking-lote-modalidad.sql
-- o, si se usa el flujo de push del proyecto:  npx prisma db push

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "lote" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "modalidad" TEXT;
