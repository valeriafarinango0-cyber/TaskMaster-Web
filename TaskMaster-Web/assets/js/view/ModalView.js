/**
 * CAPA VIEW — ModalView.js
 * Controla el modal de nueva/editar tarea y el modal de detalle.
 */

class ModalView {

  constructor(viewModel) {
    this._vm = viewModel;

    // Modal formulario
    this.$overlay  = document.getElementById('modal-overlay');
    this.$title    = document.getElementById('modal-title');
    this.$form     = document.getElementById('form-tarea');
    this.$id       = document.getElementById('tarea-id');
    this.$titulo   = document.getElementById('tarea-titulo');
    this.$desc     = document.getElementById('tarea-descripcion');
    this.$materia  = document.getElementById('tarea-materia');
    this.$prioridad= document.getElementById('tarea-prioridad');
    this.$fecha    = document.getElementById('tarea-fecha');
    this.$pomodoros= document.getElementById('tarea-pomodoros');
    this.$recCheck = document.getElementById('tarea-recordatorio');
    this.$recOpts  = document.getElementById('recordatorio-opts');
    this.$anticip  = document.getElementById('tarea-anticipacion');
    this.$errTit   = document.getElementById('error-titulo');
    this.$errFecha = document.getElementById('error-fecha');

    // Modal detalle
    this.$detalleOverlay = document.getElementById('modal-detalle-overlay');
    this.$detalleMateria = document.getElementById('detalle-materia');
    this.$detalleTitulo  = document.getElementById('detalle-titulo');
    this.$detalleDesc    = document.getElementById('detalle-desc');
    this.$detalleFecha   = document.getElementById('detalle-fecha');
    this.$detallePrio    = document.getElementById('detalle-prioridad');
    this.$btnCompletar   = document.getElementById('btn-completar');
    this.$btnEditar      = document.getElementById('btn-editar-tarea');
    this.$btnEliminar    = document.getElementById('btn-eliminar-tarea');

    this._bindEvents();
    this._populateMaterias();
  }

  // ── Poblar select de materias ─────────────────────────────────────────────

  _populateMaterias() {
    const materias = this._vm.getMaterias();
    this.$materia.innerHTML = materias.map(m =>
      `<option value="${m.id}">${m.nombre}</option>`
    ).join('');
  }

  // ── Eventos ───────────────────────────────────────────────────────────────

  _bindEvents() {
    // Cerrar modales
    document.getElementById('btn-cerrar-modal').addEventListener('click',  () => this.cerrar());
    document.getElementById('btn-cancelar').addEventListener('click',       () => this.cerrar());
    document.getElementById('btn-cerrar-detalle').addEventListener('click', () => this.cerrarDetalle());

    // Cerrar al hacer clic fuera
    this.$overlay.addEventListener('click',        e => { if (e.target === this.$overlay)        this.cerrar(); });
    this.$detalleOverlay.addEventListener('click', e => { if (e.target === this.$detalleOverlay) this.cerrarDetalle(); });

    // Toggle recordatorio
    this.$recCheck.addEventListener('change', () => {
      this.$recOpts.style.display = this.$recCheck.checked ? 'block' : 'none';
    });

    // Submit del formulario
    this.$form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!this._validar()) return;

      const datos = {
        titulo:           this.$titulo.value.trim(),
        descripcion:      this.$desc.value.trim(),
        materia_id:       Number(this.$materia.value),
        prioridad:        this.$prioridad.value,
        fecha_limite:     this.$fecha.value,
        pomodoros_est:    Number(this.$pomodoros.value) || 1,
        min_anticipacion: this.$recCheck.checked ? Number(this.$anticip.value) : 0,
        completada:       0,
        pomodoros_real:   0,
      };

      const id = this.$id.value;
      let resultado;

      if (id) {
        resultado = await this._vm.actualizarTarea(Number(id), datos);
      } else {
        resultado = await this._vm.crearTarea(datos);
      }

      if (resultado.success) {
        this.cerrar();
        app.showToast(id ? 'Tarea actualizada ✓' : 'Tarea creada ✓', 'success');
      } else {
        app.showToast(resultado.error || 'Error al guardar', 'error');
      }
    });

    // Acciones en modal detalle
    this.$btnCompletar.addEventListener('click', async () => {
      const t = this._vm.getTareaActiva();
      if (!t) return;
      await this._vm.toggleCompletada(t.id);
      this.cerrarDetalle();
      app.showToast('Estado actualizado ✓', 'success');
    });

    this.$btnEditar.addEventListener('click', () => {
      const t = this._vm.getTareaActiva();
      if (!t) return;
      this.cerrarDetalle();
      this.abrirEditar(t);
    });

    this.$btnEliminar.addEventListener('click', async () => {
      const t = this._vm.getTareaActiva();
      if (!t) return;
      if (!confirm(`¿Eliminar "${t.titulo}"?`)) return;
      await this._vm.eliminarTarea(t.id);
      this.cerrarDetalle();
      app.showToast('Tarea eliminada', 'info');
    });
  }

  // ── Validación del formulario ─────────────────────────────────────────────

  _validar() {
    let ok = true;
    this.$errTit.textContent   = '';
    this.$errFecha.textContent = '';

    if (!this.$titulo.value.trim()) {
      this.$errTit.textContent = 'El título es obligatorio.';
      ok = false;
    }
    if (!this.$fecha.value) {
      this.$errFecha.textContent = 'La fecha límite es obligatoria.';
      ok = false;
    }
    return ok;
  }

  // ── Abrir modal nueva tarea ───────────────────────────────────────────────

  abrirNueva() {
    this.$title.textContent = 'Nueva Tarea';
    this.$form.reset();
    this.$id.value = '';
    this.$recOpts.style.display = 'block';
    // Fecha mínima = ahora
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    this.$fecha.min = ahora.toISOString().slice(0,16);
    this.$overlay.classList.add('open');
  }

  // ── Abrir modal editar tarea ──────────────────────────────────────────────

  abrirEditar(tarea) {
    this.$title.textContent   = 'Editar Tarea';
    this.$id.value            = tarea.id;
    this.$titulo.value        = tarea.titulo;
    this.$desc.value          = tarea.descripcion || '';
    this.$materia.value       = tarea.materia_id;
    this.$prioridad.value     = tarea.prioridad;
    this.$pomodoros.value     = tarea.pomodoros_est || 1;
    if (tarea.fecha_limite) {
      const f = new Date(tarea.fecha_limite);
      f.setMinutes(f.getMinutes() - f.getTimezoneOffset());
      this.$fecha.value = f.toISOString().slice(0,16);
    }
    this.$recOpts.style.display = 'block';
    this.$overlay.classList.add('open');
  }

  // ── Abrir modal detalle ───────────────────────────────────────────────────

  abrirDetalle(tarea) {
    const materia = this._vm.getMateriaById(tarea.materia_id);
    const { texto } = this._vm.etiquetaFecha(tarea.fecha_limite);

    this.$detalleMateria.textContent   = materia.nombre;
    this.$detalleMateria.style.background = materia.bg;
    this.$detalleMateria.style.color      = materia.color;
    this.$detalleTitulo.textContent    = tarea.titulo;
    this.$detalleDesc.textContent      = tarea.descripcion || 'Sin descripción.';
    this.$detalleFecha.textContent     = `📅 ${texto}`;
    this.$detallePrio.textContent      = `Prioridad: ${tarea.prioridad}`;

    // Actualizar texto del botón según estado
    this.$btnCompletar.textContent = tarea.completada ? '↩ Marcar pendiente' : '✓ Completar';

    this.$detalleOverlay.classList.add('open');
  }

  // ── Cerrar modales ────────────────────────────────────────────────────────

  cerrar() {
    this.$overlay.classList.remove('open');
    this.$form.reset();
    this.$errTit.textContent = '';
    this.$errFecha.textContent = '';
  }

  cerrarDetalle() {
    this.$detalleOverlay.classList.remove('open');
    this._vm.cerrarTareaActiva();
  }
}
