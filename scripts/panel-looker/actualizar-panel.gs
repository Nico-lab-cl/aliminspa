/**
 * Panel Alimin — descarga los datos del sitio a esta hoja de Google.
 *
 * Looker Studio lee esta hoja. Las pestañas "visitas", "leads" y "meta" se
 * reemplazan enteras en cada pasada con lo que entrega aliminspa.cl/api/panel.
 *
 * Instalación (una vez):
 *   1. Extensiones → Apps Script, pegar este archivo y guardar.
 *   2. Configuración del proyecto (engranaje) → Propiedades de la secuencia de
 *      comandos → agregar PANEL_KEY con el mismo valor que tiene Easypanel.
 *   3. Ejecutar "instalar" y autorizar. Deja una pasada cada 6 horas y hace
 *      la primera descarga al tiro.
 */

const BASE = 'https://aliminspa.cl/api/panel/';
const ARCHIVOS = [
  { hoja: 'visitas', archivo: 'visitas.csv' },
  { hoja: 'leads', archivo: 'leads.csv' },
  { hoja: 'meta', archivo: 'meta.csv' },
];

function actualizarPanel() {
  const clave = PropertiesService.getScriptProperties().getProperty('PANEL_KEY');
  if (!clave) throw new Error('Falta la propiedad PANEL_KEY (Configuración del proyecto → Propiedades).');

  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const errores = [];

  ARCHIVOS.forEach(function (a) {
    try {
      const r = UrlFetchApp.fetch(BASE + a.archivo, {
        headers: { Authorization: 'Bearer ' + clave },
        muteHttpExceptions: true,
      });
      if (r.getResponseCode() !== 200) {
        throw new Error('HTTP ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 200));
      }
      const filas = Utilities.parseCsv(r.getContentText('UTF-8'));
      if (!filas.length) throw new Error('archivo vacío');

      // Números como números; fechas y textos como texto (Looker las reconoce).
      const valores = filas.map(function (fila, i) {
        return fila.map(function (c) {
          return i > 0 && /^-?\d+(\.\d+)?$/.test(c) && c.length < 15 ? Number(c) : c;
        });
      });

      const hoja = libro.getSheetByName(a.hoja) || libro.insertSheet(a.hoja);
      hoja.clearContents();
      // La fecha queda como texto plano AAAA-MM-DD para que no dependa del idioma de la hoja.
      hoja.getRange(1, 1, Math.max(valores.length, 1), 1).setNumberFormat('@');
      hoja.getRange(1, 1, valores.length, valores[0].length).setValues(valores);
    } catch (e) {
      errores.push(a.hoja + ': ' + e.message);
    }
  });

  const estado = libro.getSheetByName('estado') || libro.insertSheet('estado');
  estado.getRange('A1:B2').setValues([
    ['Última actualización', new Date()],
    ['Errores', errores.length ? errores.join(' | ') : 'ninguno'],
  ]);
  if (errores.length) throw new Error(errores.join(' | '));
}

function instalar() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'actualizarPanel') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('actualizarPanel').timeBased().everyHours(6).create();
  actualizarPanel();
}
