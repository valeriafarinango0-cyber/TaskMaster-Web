/**
 * CAPA MODEL — QuickAddParser.js
 * Interpreta texto en lenguaje natural escrito en el título de la tarea
 * (fecha, hora, prioridad, categoría con #hashtag) y devuelve los campos
 * estructurados junto con el título ya limpio de esas menciones.
 * No manipula el DOM ni depende de otras clases.
 */

class QuickAddParser {

  constructor() {
    this._dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    this._diasAlt = { 'miercoles': 'miércoles', 'sabado': 'sábado' };
    this._categorias = {
      'trabajo': 'Trabajo', 'estudio': 'Estudio', 'personal': 'Personal',
      'bienestar': 'Bienestar', 'recados': 'Recados', 'recado': 'Recados',
      'planificacion': 'Planificación', 'planificación': 'Planificación', 'otros': 'Otros',
    };
  }

  /**
   * @param {string} texto - lo que el usuario escribió en el campo título
   * @returns {{titulo:string, fecha:?Date, prioridad:?string, categoria:?string, detectados:string[]}}
   */
  parse(texto) {
    let restante = ' ' + String(texto || '').trim() + ' ';
    const detectados = [];

    const prioridad = this._extraerPrioridad(restante);
    if (prioridad.valor) { restante = prioridad.restante; detectados.push('prioridad'); }

    const categoria = this._extraerCategoria(restante);
    if (categoria.valor) { restante = categoria.restante; detectados.push('categoría'); }

    const fecha = this._extraerFecha(restante);
    if (fecha.valor) { restante = fecha.restante; detectados.push('fecha'); }

    const titulo = restante.replace(/\s+/g, ' ').trim();

    return {
      titulo,
      fecha: fecha.valor,
      prioridad: prioridad.valor,
      categoria: categoria.valor,
      detectados,
    };
  }

  // ── Prioridad ──────────────────────────────────────────────────────────

  _extraerPrioridad(texto) {
    const patrones = [
      { re: /\s(urgente|alta prioridad|prioridad alta|!alta|!urgente)\s/i, valor: 'Alta' },
      { re: /\s(media prioridad|prioridad media|!media)\s/i, valor: 'Media' },
      { re: /\s(baja prioridad|prioridad baja|!baja)\s/i, valor: 'Baja' },
      // Palabra suelta "alta"/"media"/"baja" solo si no es parte de otra palabra
      { re: /\balta\b/i, valor: 'Alta' },
      { re: /\bmedia\b/i, valor: 'Media' },
      { re: /\bbaja\b/i, valor: 'Baja' },
    ];
    for (const p of patrones) {
      const m = texto.match(p.re);
      if (m) return { valor: p.valor, restante: texto.replace(p.re, ' ') };
    }
    return { valor: null, restante: texto };
  }

  // ── Categoría (#hashtag) ──────────────────────────────────────────────

  _extraerCategoria(texto) {
    const m = texto.match(/#([a-zA-ZÀ-ÿ]+)/);
    if (!m) return { valor: null, restante: texto };
    const clave = m[1].toLowerCase();
    const categoria = this._categorias[clave];
    if (!categoria) return { valor: null, restante: texto };
    return { valor: categoria, restante: texto.replace(m[0], ' ') };
  }

  // ── Fecha y hora ──────────────────────────────────────────────────────

  _extraerFecha(texto) {
    const ahora = new Date();
    let base = null;
    let restante = texto;
    let horaYaFijada = false; // true cuando la expresión de fecha ya trae una hora precisa ("en 2 horas")

    // hoy / mañana
    let m = restante.match(/\b(hoy|mañana|manana)\b/i);
    if (m) {
      base = new Date(ahora);
      if (/mañana|manana/i.test(m[1])) base.setDate(base.getDate() + 1);
      restante = restante.replace(m[0], ' ');
    }

    // en N día(s)/hora(s)
    if (!base) {
      m = restante.match(/\ben\s+(\d+)\s+(d[ií]as?|horas?)\b/i);
      if (m) {
        base = new Date(ahora);
        const n = parseInt(m[1], 10);
        if (/d[ií]a/i.test(m[2])) {
          base.setDate(base.getDate() + n);
        } else {
          base.setHours(base.getHours() + n);
          horaYaFijada = true;
        }
        restante = restante.replace(m[0], ' ');
      }
    }

    // día de la semana ("el lunes", "martes")
    if (!base) {
      const nombreDias = this._dias.concat(Object.keys(this._diasAlt));
      const re = new RegExp('\\b(?:el\\s+|la\\s+)?(' + nombreDias.join('|') + ')\\b', 'i');
      m = restante.match(re);
      if (m) {
        let nombre = m[1].toLowerCase();
        nombre = this._diasAlt[nombre] || nombre;
        const idxObjetivo = this._dias.indexOf(nombre);
        if (idxObjetivo >= 0) {
          base = new Date(ahora);
          let diff = idxObjetivo - base.getDay();
          if (diff <= 0) diff += 7;
          base.setDate(base.getDate() + diff);
          restante = restante.replace(m[0], ' ');
        }
      }
    }

    // hora: "5pm", "5:30 pm", "17:00", "a las 5", "a las 5:30"
    let hora = null, minutos = 0;
    m = restante.match(/\b(?:a las\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.?m\.?|p\.?m\.?)?\b/i);
    if (m) {
      hora = parseInt(m[1], 10);
      minutos = m[2] ? parseInt(m[2], 10) : 0;
      const ampm = (m[3] || '').toLowerCase().replace(/\./g, '');
      if (ampm.startsWith('p') && hora < 12) hora += 12;
      if (ampm.startsWith('a') && hora === 12) hora = 0;
      if (hora >= 0 && hora <= 23 && minutos >= 0 && minutos <= 59) {
        restante = restante.replace(m[0], ' ');
      } else {
        hora = null;
      }
    }

    if (!base && hora !== null) {
      // Solo se dio una hora sin día explícito → asumir hoy (o mañana si ya pasó)
      base = new Date(ahora);
      base.setHours(hora, minutos, 0, 0);
      if (base < ahora) base.setDate(base.getDate() + 1);
      return { valor: base, restante };
    }

    if (base) {
      if (hora !== null) base.setHours(hora, minutos, 0, 0);
      else if (!horaYaFijada) base.setHours(9, 0, 0, 0);
      return { valor: base, restante };
    }

    return { valor: null, restante: texto };
  }
}

// Instancia global compartida
const quickAddParser = new QuickAddParser();
