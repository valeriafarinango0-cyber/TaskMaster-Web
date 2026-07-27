function escaparTexto(texto = '') {
  return String(texto)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function formatoFechaICS(fecha) {
  const d = new Date(fecha);
  const pad = n => String(n).padStart(2, '0');
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) + 'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) + 'Z'
  );
}

function tareaAVEvent(tarea) {
  const ahora = formatoFechaICS(new Date());
  const inicio = formatoFechaICS(tarea.fecha_limite);
  return [
    'BEGIN:VEVENT',
    `UID:taskmaster-tarea-${tarea.id}@taskmaster.local`,
    `DTSTAMP:${ahora}`,
    `DTSTART:${inicio}`,
    `SUMMARY:${escaparTexto(tarea.titulo)}`,
    `DESCRIPTION:${escaparTexto(tarea.descripcion || '')}`,
    `PRIORITY:${tarea.prioridad === 'Alta' ? 1 : tarea.prioridad === 'Media' ? 5 : 9}`,
    'END:VEVENT',
  ].join('\r\n');
}

export function generarICS(tareas) {
  const lista = Array.isArray(tareas) ? tareas : [tareas];
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TaskMaster//Integraciones//ES',
    'CALSCALE:GREGORIAN',
    ...lista.map(tareaAVEvent),
    'END:VCALENDAR',
  ].join('\r\n');
}
