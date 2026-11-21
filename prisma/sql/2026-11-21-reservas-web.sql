-- Reservas pagadas con Webpay desde aliminspa.cl/reservar/arena-y-sol
-- (21-11-2026). Ver model ReservaWeb en schema.prisma.
--
-- Aplicar con:  psql "$DATABASE_URL" -f prisma/sql/2026-11-21-reservas-web.sql
-- Se puede correr más de una vez sin romper nada (IF NOT EXISTS).

BEGIN;

CREATE TABLE IF NOT EXISTS "reservas_web" (
    "id"                       TEXT PRIMARY KEY,
    "folio"                    TEXT NOT NULL UNIQUE,
    "proyecto"                 TEXT NOT NULL,
    "lote"                     INTEGER NOT NULL,
    "nombre"                   TEXT NOT NULL,
    "rut"                      TEXT NOT NULL,
    "email"                    TEXT NOT NULL,
    "celular"                  TEXT NOT NULL,
    "monto"                    INTEGER NOT NULL,
    "estado"                   TEXT NOT NULL DEFAULT 'pendiente',
    "buy_order"                TEXT NOT NULL UNIQUE,
    "token"                    TEXT UNIQUE,
    "expira_en"                TIMESTAMP(3) NOT NULL,
    "pagada_at"                TIMESTAMP(3),
    "codigo_autorizacion"      TEXT,
    "tarjeta"                  TEXT,
    "tipo_pago"                TEXT,
    "cuotas_tarjeta"           INTEGER,
    "origen"                   TEXT,
    "utm_source"               TEXT,
    "utm_medium"               TEXT,
    "utm_campaign"             TEXT,
    "avisos_at"                TIMESTAMP(3),
    "crm_lead_id"              TEXT,
    "consentimiento_contacto"  BOOLEAN,
    "consentimiento_marketing" BOOLEAN,
    "consentimiento_at"        TIMESTAMP(3),
    "politica_version"         TEXT,
    "consentimiento_origen"    TEXT,
    "created_at"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "reservas_web_proyecto_lote_idx" ON "reservas_web" ("proyecto", "lote");

-- Nunca dos reservas pagadas del mismo lote.
CREATE UNIQUE INDEX IF NOT EXISTS "reservas_web_lote_pagado_key"
    ON "reservas_web" ("proyecto", "lote") WHERE "estado" = 'pagada';

COMMIT;
