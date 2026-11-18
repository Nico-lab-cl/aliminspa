-- Contador de visitas propio, sin cookies (panel de Looker Studio, nov-2026).
-- La app crea esta tabla sola la primera vez que cuenta una visita
-- (src/lib/panel.ts, asegurarTabla); este archivo queda como referencia.
--
-- Solo totales por día: no hay IP, cookie ni identificador de la persona.

CREATE TABLE IF NOT EXISTS panel_visitas_diarias (
    fecha date NOT NULL,
    ruta text NOT NULL,
    origen text NOT NULL,
    fuente text NOT NULL DEFAULT '',
    medio text NOT NULL DEFAULT '',
    campana text NOT NULL DEFAULT '',
    dispositivo text NOT NULL,
    vistas integer NOT NULL DEFAULT 0,
    entradas integer NOT NULL DEFAULT 0,
    PRIMARY KEY (fecha, ruta, origen, fuente, medio, campana, dispositivo)
);
