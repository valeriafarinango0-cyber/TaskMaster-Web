/**
 * CAPA VIEWMODEL — TaskViewModel.js
 * Coordina entre los Models y las Views.
 * Gestiona el estado global de la aplicación.
 * NO manipula el DOM directamente.
 */

class TaskViewModel {

  constructor(model, categoriaModel) {
    this._model     = model;
    this._catModel  = categoriaModel;

    this._state = {
      tareas:         [],
      categorias:     [],
      filtroActivo:   'todas',   // 'todas' o id de categoría
      tareaActiva:    null,      // tarea abierta en detalle/enfoque
      semanaOffset:   0,         // 0 = semana actual, -1 = anterior, +1 = siguiente
      cargando:       false,
      error:          null,
    };

    this._listeners = [];
  }

  // ── Suscripción al estado ─────────────────────────────────────────────────

  subscribe(fn) { this._listeners.push(fn); }

  _notify(evento, payload = {}) {
    this._listeners.forEach(fn => fn(evento, { ...this._state, ...payload }));
  }

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

  // ── Acciones sobre tareas ─────────────────────────────────────────────────

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

  async actualizarTarea(id, cambios) {
    const resultado = await this._model.update(id, cambios);
    await this.cargarTareas();
    if (!resultado.success) {
      this._notify('error', { error: resultado.error || 'No se pudo actualizar la tarea.' });
      return resultado;
    }
    this._notify('tareaActualizada');
    return resultado;
  }

  async eliminarTarea(id) {
    const resultado = await this._model.delete(id);
    if (resultado.success) {
      this._state.tareaActiva = null;
      await this.cargarTareas();
      this._notify('tareaEliminada');
    }
    return resultado;
  }

  async toggleCompletada(id) {
    await this._model.toggleCompleta(id);
    await this.cargarTareas();
    this._notify('tareasActualizadas');
  }

  async registrarPomodoro(id) {
    const tarea = this._state.tareas.find(t => t.id === id);
    if (!tarea) return;
    const real = (tarea.pomodoros_real || 0) + 1;
    await this._model.update(id, { pomodoros_real: real });
    this._state.tareas = this._state.tareas.map(t =>
      t.id === id ? { ...t, pomodoros_real: real } : t
    );
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

  setFiltro(filtro) {
    this._state.filtroActivo = filtro;
    this._notify('filtroChanged');
  }

  setTareaActiva(tarea) {
    this._state.tareaActiva = tarea;
    this._notify('tareaActivaChanged');
  }

  cerrarTareaActiva() {
    this._state.tareaActiva = null;
    this._notify('tareaActivaChanged');
  }

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

  // ── Utilidades de presentación (cálculos sin DOM) ─────────────────────────

  etiquetaFecha(fechaLimite)     { return this._model.etiquetaFecha(fechaLimite); }
  calcularUrgencia(fechaLimite)  { return this._model.calcularUrgencia(fechaLimite); }
}

// Instancia global
const taskViewModel = new TaskViewModel(taskModel, categoriaModel);
