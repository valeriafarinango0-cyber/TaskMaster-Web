/**
 * CAPA VIEW — ModalView.js
 * Controla el modal de nueva/editar tarea (con creación de categorías propias)
 * y el modal de detalle de tarea.
 */

class ModalView {

  constructor(viewModel) {
    this._vm = viewModel;

    // Modal formulario
    this.$overlay   = document.getElementById('modal-overlay');
    this.$title     = document.getElementById('modal-title');
    this.$form      = document.getElementById('form-tarea');
    this.$id        = document.getElementById('tarea-id');
    this.$titulo    = document.getElementById('tarea-titulo');
    this.$desc      = document.getElementById('tarea-descripcion');
    this.$categoria = document.getElementById('tarea-categoria');
    this.$catDot    = document.getElementById('categoria-dot-preview');
    this.$catNuevaForm    = document.getElementById('categoria-nueva-form');
    this.$catNuevaNombre  = document.getElementById('categoria-nueva-nombre');
    this.$catNuevaColor   = document.getElementById('categoria-nueva-color');
    this.$btnCrearCategoria = document.getElementById('btn-crear-categoria');
    this.$prioridadInput = document.getElementById('tarea-prioridad');
    this.$priorityBtns   = [...document.querySelectorAll('.priority-btn')];
    this.$fecha          = document.getElementById('tarea-fecha');
    this.$pomodoros      = document.getElementById('tarea-pomodoros');
    this.$pomodoroCount  = document.getElementById('pomodoro-count');
    this.$recCheck       = document.getElementById('tarea-recordatorio');
    this.$recOpts        = document.getElementById('recordatorio-opts');
    this.$anticip        = document.getElementById('tarea-anticipacion');
    this.$errTit         = document.getElementById('error-titulo');
    this.$errFecha       = document.getElementById('error-fecha');

    // Modal detalle
    this.$detalleOverlay  = document.getElementById('modal-detalle-overlay');
    this.$detalleMateria  = document.getElementById('detalle-materia');
    this.$detalleTitulo   = document.getElementById('detalle-titulo');
    this.$detalleDesc     = document.getElementById('detalle-desc');
    this.$detalleBanner   = document.getElementById('detalle-urgencia-banner');
    this.$detalleFecha    = document.getElementById('detalle-fecha');
    this.$detallePrio     = document.getElementById('detalle-prioridad');
    this.$detalleRecordatorio = document.getElementById('detalle-recordatorio');
    this.$detalleProgreso     = document.getElementById('detalle-progreso');
    this.$detalleProgresoFill = document.getElementById('detalle-progreso-fill');
    this.$detalleTiempoReal   = document.getElementById('detalle-tiempo-real');
    this.$btnCompletar    = document.getElementById('btn-completar');
    this.$btnEditar       = document.getElementById('btn-editar-tarea');
    this.$btnEliminar     = document.getElementById('btn-eliminar-tarea');
    this.$btnIniciarEnfoque = document.getElementById('btn-iniciar-enfoque');

    this._bindEvents();
  }

  // ── Poblar select de categorías ───────────────────────────────────────────

  _populateCategorias(seleccionarId = null) {
    const categorias = this._vm.getCategorias();
    this.$categoria.innerHTML = categorias.map(c =>
      `<option value="${c.id}">${c.icono || ''} ${c.nombre}</option>`
    ).join('') + `<option value="__nueva__">+ Crear categoría</option>`;

    if (seleccionarId) {
      this.$categoria.value = String(seleccionarId);
    } else if (categorias.length) {
      this.$categoria.value = String(categorias[0].id);
    }
    this._actualizarDotPreview();
  }

  _actualizarDotPreview() {
    const cat = this._vm.getCategoriaById(this.$categoria.value);
    this.$catDot.style.background = cat ? cat.color : '#8892A4';
  }

  // ── Eventos ───────────────────────────────────────────────────────────────

  _bindEvents() {
    document.getElementById('btn-cerrar-modal').addEventListener('click',  () => this.cerrar());
    document.getElementById('btn-cancelar').addEventListener('click',       () => this.cerrar());
    document.getElementById('btn-cerrar-detalle').addEventListener('click', () => this.cerrarDetalle());

    this.$overlay.addEventListener('click',        e => { if (e.target === this.$overlay)        this.cerrar(); });
    this.$detalleOverlay.addEventListener('click', e => { if (e.target === this.$detalleOverlay) this.cerrarDetalle(); });

    this.$priorityBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.$priorityBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.$prioridadInput.value = btn.dataset.priority;
      });
    });

    this.$pomodoros.addEventListener('input', () => {
      this.$pomodoroCount.textContent = this.$pomodoros.value;
    });

    this.$recCheck.addEventListener('change', () => {
      this.$recOpts.style.display = this.$recCheck.checked ? 'block' : 'none';
    });

    this.$categoria.addEventListener('change', () => {
      if (this.$categoria.value === '__nueva__') {
        this.$catNuevaForm.classList.add('open');
        this.$catNuevaNombre.focus();
      } else {
        this.$catNuevaForm.classList.remove('open');
        this._actualizarDotPreview();
      }
    });

    this.$btnCrearCategoria.addEventListener('click', async () => {
      const nombre = this.$catNuevaNombre.value.trim();
      const color  = this.$catNuevaColor.value;
      if (!nombre) {
        app.showToast('Escribe un nombre para la categoría', 'error');
        return;
      }
      const resultado = await this._vm.crearCategoria({ nombre, color });
      if (resultado.success) {
        this._populateCategorias(resultado.categoria.id);
        this.$catNuevaForm.classList.remove('open');
        this.$catNuevaNombre.value = '';
        app.showToast('Categoría creada ✓', 'success');
      } else {
        app.showToast(resultado.error || 'No se pudo crear la categoría', 'error');
      }
    });

    this.$form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!this._validar()) return;

      const categoriaId = this.$categoria.value === '__nueva__' ? null : Number(this.$categoria.value) || null;

      const datos = {
        titulo:           this.$titulo.value.trim(),
        descripcion:      this.$desc.value.trim(),
        categoria_id:     categoriaId,
        prioridad:        this.$prioridadInput.value,
        fecha_limite:     this.$fecha.value,
        pomodoros_est:    Number(this.$pomodoros.value) || 1,
        min_anticipacion: this.$recCheck.checked ? Number(this.$anticip.value) : 0,
      };

      const id = this.$id.value;
      if (id) {
        const tareaActual = this._vm.getTareas().find(t => t.id === Number(id));
        datos.completada     = tareaActual ? tareaActual.completada : 0;
        datos.pomodoros_real = tareaActual ? tareaActual.pomodoros_real : 0;
      } else {
        datos.completada     = 0;
        datos.pomodoros_real = 0;
      }

      const resultado = id
        ? await this._vm.actualizarTarea(Number(id), datos)
        : await this._vm.crearTarea(datos);

      if (resultado.success) {
        this._enviarNotificacionCreacion(datos);
        this.cerrar();
        app.showToast(id ? 'Tarea actualizada ✓' : 'Tarea creada ✓', 'success');
      } else {
        app.showToast(resultado.error || 'Error al guardar', 'error');
      }
    });

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

    this.$btnIniciarEnfoque.addEventListener('click', () => {
      const t = this._vm.getTareaActiva();
      if (!t) return;
      this.cerrarDetalle();
      app.iniciarEnfoque(t);
    });
  }

  // ── HU-03/HU-04: notificación web al crear tarea con recordatorio ─────────
  async _enviarNotificacionCreacion(datos) {
    if (!datos.min_anticipacion) return;
    try {
      await fetch('api/notify.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prioridad: datos.prioridad,
          asunto: `${datos.prioridad} — ${datos.titulo}`,
          mensaje: datos.descripcion || 'Tienes una tarea programada.'
        })
      });
    } catch (e) { /* silencioso: la notificacion nativa del navegador es la principal via HU-04 */ }
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

  abrirNueva(defaults = {}) {
    this.$title.textContent = 'Nueva Tarea';
    this.$form.reset();
    this.$id.value = '';
    this.$prioridadInput.value = 'Media';
    this.$priorityBtns.forEach(b => b.classList.toggle('active', b.dataset.priority === 'Media'));
    this.$pomodoroCount.textContent = this.$pomodoros.value;
    this.$recCheck.checked = true;
    this.$anticip.value = '30';
    this.$recOpts.style.display = 'block';
    this.$catNuevaForm.classList.remove('open');

    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    this.$fecha.min = ahora.toISOString().slice(0, 16);

    this._populateCategorias(defaults.categoria_id);
    this.$overlay.classList.add('open');

    if (defaults.titulo) this.$titulo.value = defaults.titulo;
    if (defaults.descripcion) this.$desc.value = defaults.descripcion;
    if (defaults.prioridad) {
      this.$prioridadInput.value = defaults.prioridad;
      this.$priorityBtns.forEach(b => b.classList.toggle('active', b.dataset.priority === defaults.prioridad));
    }
    if (defaults.fecha_limite) {
      const f = new Date(defaults.fecha_limite);
      f.setMinutes(f.getMinutes() - f.getTimezoneOffset());
      this.$fecha.value = f.toISOString().slice(0, 16);
    }
    if (defaults.pomodoros_est) {
      this.$pomodoros.value = defaults.pomodoros_est;
      this.$pomodoroCount.textContent = defaults.pomodoros_est;
    }
  }

  // ── Abrir modal editar tarea ──────────────────────────────────────────────

  abrirEditar(tarea) {
    this.$title.textContent    = 'Editar Tarea';
    this.$id.value             = tarea.id;
    this.$titulo.value         = tarea.titulo;
    this.$desc.value           = tarea.descripcion || '';
    this.$prioridadInput.value = tarea.prioridad;
    this.$priorityBtns.forEach(b => b.classList.toggle('active', b.dataset.priority === tarea.prioridad));
    this.$pomodoros.value      = tarea.pomodoros_est || 1;
    this.$pomodoroCount.textContent = this.$pomodoros.value;
    this.$recCheck.checked     = tarea.min_anticipacion > 0;
    this.$anticip.value        = tarea.min_anticipacion ? String(tarea.min_anticipacion) : '30';
    this.$recOpts.style.display = this.$recCheck.checked ? 'block' : 'none';
    this.$catNuevaForm.classList.remove('open');

    this._populateCategorias(tarea.categoria_id);

    if (tarea.fecha_limite) {
      const f = new Date(tarea.fecha_limite);
      f.setMinutes(f.getMinutes() - f.getTimezoneOffset());
      this.$fecha.value = f.toISOString().slice(0, 16);
    }
    this.$overlay.classList.add('open');
  }

  // ── Abrir modal detalle ───────────────────────────────────────────────────

  abrirDetalle(tarea) {
    const categoria = this._vm.getCategoriaById(tarea.categoria_id);
    const { texto } = this._vm.etiquetaFecha(tarea.fecha_limite);
    const urgencia = this._vm.calcularUrgencia(tarea.fecha_limite);
    const color = categoria ? categoria.color : '#8892A4';

    this.$detalleMateria.textContent      = categoria ? `${categoria.icono || ''} ${categoria.nombre}` : 'Sin categoría';
    this.$detalleMateria.style.background = `${color}33`;
    this.$detalleMateria.style.color      = color;
    this.$detalleTitulo.textContent       = tarea.titulo;
    this.$detalleDesc.textContent         = tarea.descripcion || 'Sin descripción.';
    this.$detalleFecha.textContent        = `📅 Vence: ${texto}`;
    this.$detallePrio.textContent         = tarea.prioridad;
    this.$detalleRecordatorio.textContent = tarea.min_anticipacion > 0
      ? `Sí, ${tarea.min_anticipacion} min antes`
      : 'No programado';

    const bannerClase = tarea.prioridad === 'Alta' ? 'urgente' : tarea.prioridad === 'Media' ? 'medio' : 'ok';
    this.$detalleBanner.style.background = bannerClase === 'urgente' ? 'rgba(245,87,108,.14)' : bannerClase === 'medio' ? 'rgba(240,147,251,.14)' : 'rgba(146,254,157,.14)';
    this.$detalleBanner.style.color      = bannerClase === 'urgente' ? 'var(--urgente)' : bannerClase === 'medio' ? 'var(--medio)' : 'var(--ok)';
    this.$detalleBanner.style.borderColor = this.$detalleBanner.style.color;

    const est = tarea.pomodoros_est || 1;
    const real = tarea.pomodoros_real || 0;
    this.$detalleProgreso.textContent = `${real}/${est}`;
    this.$detalleProgresoFill.style.width = `${Math.min(100, Math.round((real / est) * 100))}%`;
    this.$detalleProgresoFill.style.background = color;
    this.$detalleTiempoReal.textContent = `${real * 25} min invertidos de ${est * 25} min estimados`;

    this.$btnCompletar.textContent = tarea.completada ? '↩ Marcar pendiente' : '✓ Completar';

    this.$detalleOverlay.classList.add('open');
  }

  // ── Cerrar modales ────────────────────────────────────────────────────────

  cerrar() {
    this.$overlay.classList.remove('open');
    this.$form.reset();
    this.$errTit.textContent = '';
    this.$errFecha.textContent = '';
    this.$catNuevaForm.classList.remove('open');
  }

  cerrarDetalle() {
    this.$detalleOverlay.classList.remove('open');
    this._vm.cerrarTareaActiva();
  }
}
