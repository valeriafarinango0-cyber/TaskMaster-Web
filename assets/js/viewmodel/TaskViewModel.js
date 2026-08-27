/**
 * CAPA VIEWMODEL — TaskViewModel.js
<<<<<<< HEAD
 * Coordina entre los Models y las Views.
=======
 * Coordina entre el Model y las Views.
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
 * Gestiona el estado global de la aplicación.
 * NO manipula el DOM directamente.
 */

class TaskViewModel {

<<<<<<< HEAD
  constructor(model, categoriaModel) {
    this._model     = model;
    this._catModel  = categoriaModel;

    this._state = {
      tareas:         [],
      categorias:     [],
      filtroActivo:   'todas',   // 'todas' o id de categoría
      tareaActiva:    null,      // tarea abierta en detalle/enfoque
      semanaOffset:   0,         // 0 = semana actual, -1 = anterior, +1 = siguiente
=======
  constructor(model, materiaModel) {
    this._model        = model;
    this._matModel     = materiaModel;

    // Mapeo de nombres genéricos para mostrar categorías más universales
    this._genericNamesPool = ['Trabajo','Estudio','Personal','Bienestar','Recados','Planificación','Creatividad','Investigación','Salud','Finanzas'];
    this._genericMap = {}; // materia_id -> generic name

    // Categorías generales para tareas (nombres en español)
    this._generalCategories = ['Trabajo','Estudio','Personal','Bienestar','Recados','Planificación','Otros'];
    this._categoryKeywords = {
      'Trabajo': ['trabajo','proyecto','empresa','reunion','programaci','gestion'],
      'Estudio': ['estudio','examen','practica','laboratorio','clase','curso','materia'],
      'Personal': ['personal','hogar','familia','cumple','casa'],
      'Bienestar': ['salud','meditar','gym','ejercicio','bienestar'],
      'Recados': ['compras','recado','mandado','pagar','entregar'],
      'Planificación': ['plan','planificacion','objetivo','roadmap','planificar'],
      'Otros': []
    };

    // Estado observable
    this._state = {
      tareas:         [],
      filtroActivo:   'todas',   // 'todas' o id de materia
      tareaActiva:    null,      // tarea abierta en detalle
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
      cargando:       false,
      error:          null,
    };

<<<<<<< HEAD
=======
    // Suscriptores (Views que escuchan cambios)
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
    this._listeners = [];
  }

  // ── Suscripción al estado ─────────────────────────────────────────────────

<<<<<<< HEAD
  subscribe(fn) { this._listeners.push(fn); }

=======
  /** Registra una función que se llama cuando el estado cambia */
  subscribe(fn) { this._listeners.push(fn); }

  /** Notifica a todos los suscriptores */
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
  _notify(evento, payload = {}) {
    this._listeners.forEach(fn => fn(evento, { ...this._state, ...payload }));
  }

<<<<<<< HEAD
  // ── Getters ────────────────────────────────────────────────────────────────

  getTareas()       { return [...this._state.tareas]; }
  getTareaActiva()  { return this._state.tareaActiva; }
  getCategorias()   { return [...this._state.categorias]; }
  getFiltroActivo() { return this._state.filtroActivo; }
  getCategoriaById(id) { return this._state.categorias.find(c => c.id === Number(id)) || null; }

  getTareasFiltradas() {
    const { tareas, filtroActivo } = this._state;
    if (filtroActivo === 'todas') return tareas;
    if (filtroActivo === 'pendientes') return tareas.filter(t => !t.completada);
    if (filtroActivo === 'completadas') return tareas.filter(t => t.completada);
    return tareas.filter(t => String(t.categoria_id) === String(filtroActivo));
  }

  // ── Carga de datos ─────────────────────────────────────────────────────────

  async cargarTodo() {
    this._state.cargando = true;
    this._notify('loading');
    const [tareas, categorias] = await Promise.all([
      this._model.getAll(),
      this._catModel.getAll(),
    ]);
    this._state.tareas     = tareas;
    this._state.categorias = categorias;
    this._state.cargando   = false;
    this._notify('tareasActualizadas');
  }

  async cargarTareas() {
    this._state.tareas = await this._model.getAll();
    this._notify('tareasActualizadas');
  }

  /** Aplica un cambio recibido en tiempo real (Firestore) desde otra pestaña/dispositivo. */
  aplicarActualizacionRemota(tareas) {
    this._state.tareas = tareas;
    this._notify('tareasActualizadas');
  }

  // ── Acciones sobre tareas ─────────────────────────────────────────────────

=======
  // ── Getters del estado ────────────────────────────────────────────────────

  getTareas()       { return [...this._state.tareas]; }
  getTareaActiva()  { return this._state.tareaActiva; }
  getMaterias()     { return this._matModel.getAll(); }

  /** Devuelve un nombre genérico para una materia (persistente por id) */
  getDisplayMateriaName(materia) {
    if (!materia) return '';
    const id = materia.id;
    if (this._genericMap[id]) return this._genericMap[id];
    // Asignar por índice para consistencia
    const pool = this._genericNamesPool;
    const name = pool[(id - 1) % pool.length] || materia.nombre;
    this._genericMap[id] = name;
    return name;
  }
  getFiltroActivo() { return this._state.filtroActivo; }

  /** Tareas filtradas según el filtro activo */
  getTareasFiltradas() {
    const { tareas, filtroActivo } = this._state;
    if (filtroActivo === 'todas') return tareas;
    // Soporte para filtros generales: 'general:Work' etc.
    if (String(filtroActivo).startsWith('general:')) {
      const cat = String(filtroActivo).split(':')[1];
      return tareas.filter(t => this.getGeneralCategory(t) === cat);
    }
    if (String(filtroActivo).startsWith('especial:')) {
      const cat = String(filtroActivo).split(':')[1];
      switch (cat) {
        case 'urgentes':
          return tareas.filter(t => t.prioridad === 'Alta' && !t.completada);
        case 'tareas':
          return tareas;
        case 'totales':
          return tareas;
        case 'completadas':
          return tareas.filter(t => t.completada);
        default:
          return tareas;
      }
    }
    return tareas.filter(t => String(t.materia_id) === String(filtroActivo));
  }

  // ── Acciones ──────────────────────────────────────────────────────────────

  /** Carga inicial de tareas desde la API */
  async cargarTareas() {
    this._state.cargando = true;
    this._notify('loading');
    const tareas = await this._model.getAll();
    this._state.tareas   = tareas;
    this._state.cargando = false;
    this._notify('tareasActualizadas');
  }

  /** Crea una nueva tarea con validación */
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
  async crearTarea(datos) {
    const resultado = await this._model.create(datos);
    if (!resultado.success) {
      this._notify('error', { error: resultado.error });
      return resultado;
    }
    await this.cargarTareas();
    this._notify('tareaCreada');
    return resultado;
  }

<<<<<<< HEAD
  async actualizarTarea(id, cambios) {
    const resultado = await this._model.update(id, cambios);
    await this.cargarTareas();
    if (!resultado.success) {
      this._notify('error', { error: resultado.error || 'No se pudo actualizar la tarea.' });
      return resultado;
    }
=======
  /** Actualiza una tarea existente */
  async actualizarTarea(id, cambios) {
    const resultado = await this._model.update(id, cambios);
    if (!resultado.success) {
      this._notify('error', { error: 'No se pudo actualizar la tarea.' });
      return resultado;
    }
    await this.cargarTareas();
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
    this._notify('tareaActualizada');
    return resultado;
  }

<<<<<<< HEAD
=======
  /** Elimina una tarea */
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
  async eliminarTarea(id) {
    const resultado = await this._model.delete(id);
    if (resultado.success) {
      this._state.tareaActiva = null;
      await this.cargarTareas();
      this._notify('tareaEliminada');
    }
    return resultado;
  }

<<<<<<< HEAD
  async toggleCompletada(id) {
    await this._model.toggleCompleta(id);
    await this.cargarTareas();
    this._notify('tareasActualizadas');
  }

=======
  /** Marca o desmarca una tarea como completada */
  async toggleCompletada(id) {
    await this._model.toggleCompleta(id);
    await this.cargarTareas();
  }

  /** Registra un Pomodoro completado en la tarea activa */
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
  async registrarPomodoro(id) {
    const tarea = this._state.tareas.find(t => t.id === id);
    if (!tarea) return;
    const real = (tarea.pomodoros_real || 0) + 1;
    await this._model.update(id, { pomodoros_real: real });
    this._state.tareas = this._state.tareas.map(t =>
      t.id === id ? { ...t, pomodoros_real: real } : t
    );
<<<<<<< HEAD
    if (this._state.tareaActiva && this._state.tareaActiva.id === id) {
      this._state.tareaActiva = { ...this._state.tareaActiva, pomodoros_real: real };
    }
    this._notify('pomodoroRegistrado');
  }

  // ── Categorías ─────────────────────────────────────────────────────────────

  async crearCategoria(datos) {
    const resultado = await this._catModel.create(datos);
    if (resultado.success) {
      this._state.categorias = this._catModel.getCached();
      this._notify('categoriaCreada');
    }
    return resultado;
  }

  // ── Filtro / selección ────────────────────────────────────────────────────

=======
    this._notify('pomodoroRegistrado');
  }

  /** Cambia el filtro de materia */
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
  setFiltro(filtro) {
    this._state.filtroActivo = filtro;
    this._notify('filtroChanged');
  }

<<<<<<< HEAD
=======
  /** Abre una tarea en el detalle */
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
  setTareaActiva(tarea) {
    this._state.tareaActiva = tarea;
    this._notify('tareaActivaChanged');
  }

<<<<<<< HEAD
=======
  /** Cierra el detalle */
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
  cerrarTareaActiva() {
    this._state.tareaActiva = null;
    this._notify('tareaActivaChanged');
  }

<<<<<<< HEAD
  // ── Navegación semanal ────────────────────────────────────────────────────

  moverSemana(delta) {
    this._state.semanaOffset += delta;
    this._notify('semanaChanged');
  }

  getRangoSemana() {
    const hoy = new Date();
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - hoy.getDay() + (this._state.semanaOffset * 7));
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);
    fin.setHours(23, 59, 59, 999);

    const texto = this._state.semanaOffset === 0
      ? 'Esta semana'
      : `${inicio.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} – ${fin.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`;

    return { inicio, fin, texto };
  }

  // ── Datos para la vista semanal / estadísticas ────────────────────────────

  getDatosSemana() {
    const { inicio, fin } = this.getRangoSemana();
    const tareasSemana = this._state.tareas.filter(t => {
      if (!t.fecha_limite) return false;
      const f = new Date(t.fecha_limite);
      return f >= inicio && f <= fin;
    });

    const porDia = this._model.agruparPorDia(tareasSemana, inicio);
    const categorias = this._state.categorias;

    const pomSemana = tareasSemana.reduce((s, t) => s + (t.pomodoros_real || 0), 0);
    const urgentes   = tareasSemana.filter(t => t.prioridad === 'Alta' && !t.completada).length;
    const medias     = tareasSemana.filter(t => t.prioridad === 'Media' && !t.completada).length;
    const completadas= tareasSemana.filter(t => t.completada).length;

    const avanceCategorias = categorias.map(cat => {
      const deCat = tareasSemana.filter(t => Number(t.categoria_id) === Number(cat.id));
      if (!deCat.length) return null;
      const hechas = deCat.filter(t => t.completada).length;
      return { categoria: cat, pct: Math.round((hechas / deCat.length) * 100) };
    }).filter(Boolean);

    return {
      porDia, categorias, avanceCategorias,
      pomSemana, urgentes, medias, completadas,
      racha: this._calcularRacha(),
    };
  }

  _calcularRacha() {
    const diasConCompletadas = new Set(
      this._state.tareas
        .filter(t => t.completada && t.fecha_limite)
        .map(t => new Date(t.fecha_limite).toDateString())
    );
    let racha = 0;
    const cursor = new Date();
    while (diasConCompletadas.has(cursor.toDateString())) {
      racha++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return racha;
  }

  getRacha() { return this._calcularRacha(); }

  // ── Gamificación: nivel por constancia (autocontrol / disciplina) ────────
  // Se calcula del lado del cliente a partir de tareas completadas — sin
  // tabla nueva en la base de datos.

  static NIVELES = [
    { min: 0,   nombre: 'Aprendiz',                  icono: '🌱' },
    { min: 5,   nombre: 'Constante',                 icono: '🔥' },
    { min: 15,  nombre: 'Disciplinado',               icono: '⚡' },
    { min: 30,  nombre: 'Enfocado',                   icono: '🎯' },
    { min: 50,  nombre: 'Maestro del Enfoque',        icono: '👑' },
    { min: 100, nombre: 'Leyenda de la Productividad', icono: '🏆' },
  ];

  getNivelUsuario() {
    const completadas = this._state.tareas.filter(t => t.completada).length;
    const niveles = TaskViewModel.NIVELES;
    let idx = 0;
    for (let i = 0; i < niveles.length; i++) {
      if (completadas >= niveles[i].min) idx = i;
    }
    const actual = niveles[idx];
    const siguiente = niveles[idx + 1] || null;
    const progreso = siguiente
      ? Math.round(((completadas - actual.min) / (siguiente.min - actual.min)) * 100)
      : 100;

    return {
      nombre: actual.nombre,
      icono: actual.icono,
      completadas,
      siguiente: siguiente ? siguiente.nombre : null,
      faltan: siguiente ? siguiente.min - completadas : 0,
      progreso: Math.min(100, Math.max(0, progreso)),
    };
=======
  // ── Datos para el dashboard ───────────────────────────────────────────────

  getDatosDashboard() {
    const tareas    = this._state.tareas;
    const porDia    = this._model.agruparPorDia(tareas);
    const categorias = this.getGeneralCategories();

    // Pomodoros totales esta semana
    const pomHoy    = tareas.reduce((s, t) => s + (t.pomodoros_real || 0), 0);

    // Avance por categoría general
    const avanceCategorias = categorias.map(c => {
      const cKey = c.key;
      const cTareas = tareas.filter(t => this.getGeneralCategory(t) === cKey);
      if (!cTareas.length) return null;
      const hechas = cTareas.filter(t => t.completada).length;
      return { categoria: c, pct: Math.round((hechas / cTareas.length) * 100) };
    }).filter(Boolean);

    return { porDia, pomHoy, avanceCategorias, categorias };
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
  }

  // ── Utilidades de presentación (cálculos sin DOM) ─────────────────────────

<<<<<<< HEAD
  etiquetaFecha(fechaLimite)     { return this._model.etiquetaFecha(fechaLimite); }
  calcularUrgencia(fechaLimite)  { return this._model.calcularUrgencia(fechaLimite); }
}

// Instancia global
const taskViewModel = new TaskViewModel(taskModel, categoriaModel);
=======
  urgenciaColor(prioridad) {
    return { Alta: '--color-alta', Media: '--color-media', Baja: '--color-baja' }[prioridad] || '--color-baja';
  }

  etiquetaFecha(fechaLimite) {
    return this._model.etiquetaFecha(fechaLimite);
  }

  calcularUrgencia(fechaLimite) {
    return this._model.calcularUrgencia(fechaLimite);
  }

  getMateriaById(id) {
    return this._matModel.getById(id);
  }

  /** Devuelve las categorías generales con etiquetas en español */
  getGeneralCategories() {
    return this._generalCategories.map(k => ({ key: k, label: k }));
  }

  getCategoryLabel(key) {
    const cat = this.getGeneralCategories().find(c => c.key === key);
    return cat ? cat.label : key;
  }

  /** Determina la categoría general de una tarea (p.ej. Work, Study) */
  getGeneralCategory(tarea) {
    if (!tarea) return 'Otros';
    // Si la tarea ya trae una categoría explícita, usarla
    if (tarea.general_categoria) return tarea.general_categoria;

    const materia = this.getMateriaById(tarea.materia_id) || { nombre: '' };
    const text = ((tarea.titulo || '') + ' ' + (tarea.descripcion || '') + ' ' + (materia.nombre || '')).toLowerCase();

    for (const cat of this._generalCategories) {
      const kws = this._categoryKeywords[cat] || [];
      for (const kw of kws) {
        if (text.includes(kw.toLowerCase())) return cat;
      }
    }
    return 'Otros';
  }

  /** Devuelve color hex para una categoría general */
  getCategoryColor(cat) {
    const map = {
      'Trabajo': '#7C4DFF',
      'Estudio': '#00B8D9',
      'Personal': '#FFB020',
      'Bienestar': '#4CAF50',
      'Recados': '#FF7043',
      'Planificación': '#2196F3',
      'Otros': '#9E9E9E'
    };
    return map[cat] || '#9E9E9E';
  }
}

// Instancia global
const taskViewModel = new TaskViewModel(taskModel, materiaModel);
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
