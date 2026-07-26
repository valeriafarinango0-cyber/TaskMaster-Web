/**
 * CAPA VIEWMODEL — TaskViewModel.js
 * Coordina entre el Model y las Views.
 * Gestiona el estado global de la aplicación.
 * NO manipula el DOM directamente.
 */

class TaskViewModel {

  constructor(model, materiaModel) {
    this._model        = model;
    this._matModel     = materiaModel;

    // Estado observable
    this._state = {
      tareas:         [],
      filtroActivo:   'todas',   // 'todas' o id de materia
      tareaActiva:    null,      // tarea abierta en detalle
      cargando:       false,
      error:          null,
    };

    // Suscriptores (Views que escuchan cambios)
    this._listeners = [];
  }

  // ── Suscripción al estado ─────────────────────────────────────────────────

  /** Registra una función que se llama cuando el estado cambia */
  subscribe(fn) { this._listeners.push(fn); }

  /** Notifica a todos los suscriptores */
  _notify(evento, payload = {}) {
    this._listeners.forEach(fn => fn(evento, { ...this._state, ...payload }));
  }

  // ── Getters del estado ────────────────────────────────────────────────────

  getTareas()       { return [...this._state.tareas]; }
  getTareaActiva()  { return this._state.tareaActiva; }
  getMaterias()     { return this._matModel.getAll(); }
  getFiltroActivo() { return this._state.filtroActivo; }

  /** Tareas filtradas según el filtro activo */
  getTareasFiltradas() {
    const { tareas, filtroActivo } = this._state;
    if (filtroActivo === 'todas') return tareas;
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

  /** Actualiza una tarea existente */
  async actualizarTarea(id, cambios) {
    const resultado = await this._model.update(id, cambios);
    if (!resultado.success) {
      this._notify('error', { error: 'No se pudo actualizar la tarea.' });
      return resultado;
    }
    await this.cargarTareas();
    this._notify('tareaActualizada');
    return resultado;
  }

  /** Elimina una tarea */
  async eliminarTarea(id) {
    const resultado = await this._model.delete(id);
    if (resultado.success) {
      this._state.tareaActiva = null;
      await this.cargarTareas();
      this._notify('tareaEliminada');
    }
    return resultado;
  }

  /** Marca o desmarca una tarea como completada */
  async toggleCompletada(id) {
    await this._model.toggleCompleta(id);
    await this.cargarTareas();
    this._notify('tareasActualizadas');
  }

  /** Registra un Pomodoro completado en la tarea activa */
  async registrarPomodoro(id) {
    const tarea = this._state.tareas.find(t => t.id === id);
    if (!tarea) return;
    const real = (tarea.pomodoros_real || 0) + 1;
    await this._model.update(id, { pomodoros_real: real });
    this._state.tareas = this._state.tareas.map(t =>
      t.id === id ? { ...t, pomodoros_real: real } : t
    );
    this._notify('pomodoroRegistrado');
  }

  /** Cambia el filtro de materia */
  setFiltro(filtro) {
    this._state.filtroActivo = filtro;
    this._notify('filtroChanged');
  }

  /** Abre una tarea en el detalle */
  setTareaActiva(tarea) {
    this._state.tareaActiva = tarea;
    this._notify('tareaActivaChanged');
  }

  /** Cierra el detalle */
  cerrarTareaActiva() {
    this._state.tareaActiva = null;
    this._notify('tareaActivaChanged');
  }

  // ── Datos para el dashboard ───────────────────────────────────────────────

  getDatosDashboard() {
    const tareas    = this._state.tareas;
    const porDia    = this._model.agruparPorDia(tareas);
    const materias  = this._matModel.getAll();

    // Pomodoros totales esta semana
    const pomHoy    = tareas.reduce((s, t) => s + (t.pomodoros_real || 0), 0);

    // Avance por materia
    const avanceMaterias = materias.map(m => {
      const mTareas = tareas.filter(t => t.materia_id === m.id);
      if (!mTareas.length) return null;
      const hechas  = mTareas.filter(t => t.completada).length;
      return { materia: m, pct: Math.round((hechas / mTareas.length) * 100) };
    }).filter(Boolean);

    return { porDia, pomHoy, avanceMaterias, materias };
  }

  // ── Utilidades de presentación (cálculos sin DOM) ─────────────────────────

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
}

// Instancia global
const taskViewModel = new TaskViewModel(taskModel, materiaModel);
