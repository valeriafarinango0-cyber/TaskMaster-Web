/**
 * CAPA VIEW — HomeView.js
 * Renderiza la pantalla principal: resumen, filtros por categoría y lista de tareas.
 * Solo manipula el DOM. No contiene lógica de negocio.
 */

class HomeView {

  constructor(viewModel) {
    this._vm = viewModel;

    this.$filterRow  = document.getElementById('filter-row');
    this.$taskList   = document.getElementById('task-list');
    this.$statTotal  = document.getElementById('stat-total');
    this.$statUrgent = document.getElementById('stat-urgent');
    this.$statDone   = document.getElementById('stat-done');
  }

  // ── Chips de filtro (estado + categorías propias) ─────────────────────────

  renderFiltros() {
    const activo = this._vm.getFiltroActivo();
    const categorias = this._vm.getCategorias();

    const estados = [
      { key: 'todas',       label: 'Todas' },
      { key: 'pendientes',  label: 'Pendientes' },
      { key: 'completadas', label: 'Completadas' },
    ];

    this.$filterRow.innerHTML = '';

    estados.forEach(e => {
      const btn = document.createElement('button');
      btn.className = `chip ${activo === e.key ? 'chip--active' : ''}`;
      btn.dataset.filter = e.key;
      btn.textContent = e.label;
      this.$filterRow.appendChild(btn);
    });

    categorias.forEach(c => {
      const btn = document.createElement('button');
      btn.className = `chip ${String(activo) === String(c.id) ? 'chip--active' : ''}`;
      btn.dataset.filter = c.id;
      btn.style.borderColor = c.color;
      if (String(activo) === String(c.id)) btn.style.color = c.color;
      btn.innerHTML = `<span class="chip-dot" style="background:${c.color}"></span>${c.icono || ''} ${c.nombre}`;
      this.$filterRow.appendChild(btn);
    });

    this.$filterRow.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => this._vm.setFiltro(chip.dataset.filter));
    });
  }

  // ── Lista de tareas ───────────────────────────────────────────────────────

  renderTareas() {
    const tareas = this._vm.getTareasFiltradas();

    if (!tareas.length) {
      this.$taskList.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">📋</span>
          <p class="empty-state__text">No hay tareas aquí. ¡Toca + para agregar una!</p>
        </div>`;
      return;
    }

    const ordenadas = [...tareas].sort((a, b) => {
      if (a.completada !== b.completada) return a.completada - b.completada;
      return new Date(a.fecha_limite) - new Date(b.fecha_limite);
    });

    this.$taskList.innerHTML = ordenadas.map(t => this._renderCard(t)).join('');

    this.$taskList.querySelectorAll('.task-card').forEach(card => {
      const id = Number(card.dataset.id);
      card.addEventListener('click', e => {
        if (e.target.closest('.task-play-btn')) return;
        const tarea = this._vm.getTareas().find(t => t.id === id);
        if (tarea) this._vm.setTareaActiva(tarea);
      });
      const playBtn = card.querySelector('.task-play-btn');
      if (playBtn) {
        playBtn.addEventListener('click', e => {
          e.stopPropagation();
          const tarea = this._vm.getTareas().find(t => t.id === id);
          if (tarea) app.iniciarEnfoque(tarea);
        });
      }
    });
  }

  _renderCard(tarea) {
    const categoria = this._vm.getCategoriaById(tarea.categoria_id);
    const catColor  = categoria ? categoria.color : '#8892A4';
    const catNombre = categoria ? categoria.nombre : 'Sin categoría';
    const { texto: fechaTxt, clase: fechaCls } = this._vm.etiquetaFecha(tarea.fecha_limite);
    const urgencia = this._vm.calcularUrgencia(tarea.fecha_limite);
    const urgClass  = { Alta: 'urgency-bar__fill--alta', Media: 'urgency-bar__fill--media', Baja: 'urgency-bar__fill--baja' };
    const done = tarea.completada ? 'task-card--done' : '';

    return `
      <div class="task-card ${done}" data-id="${tarea.id}" style="border-left-color:${tarea.completada ? 'var(--ok)' : catColor}">
        <div class="task-card__top">
          <span class="task-card__title">${this._esc(tarea.titulo)}</span>
          <span class="task-card__vence ${fechaCls}">⏰ ${fechaTxt}</span>
        </div>
        <div class="task-card__meta">
          <span class="materia-pill" style="background:${catColor}33;color:${catColor}">
            <span class="materia-pill__dot" style="background:${catColor}"></span>
            ${categoria ? (categoria.icono || '') : ''} ${this._esc(catNombre)}
          </span>
          <span class="badge ${tarea.prioridad === 'Alta' ? 'badge--danger' : tarea.prioridad === 'Media' ? 'badge--warning' : 'badge--success'}">
            ${tarea.prioridad}
          </span>
        </div>
        <div class="urgency-bar">
          <div class="urgency-bar__fill ${urgClass[tarea.prioridad] || ''}" style="width:${urgencia}%"></div>
        </div>
        <div class="task-timer" data-id="${tarea.id}">
          <i class="clock-icon">🕒</i>
          <span class="timer-countdown">Calculando...</span>
        </div>
        <div class="task-card__footer">
          <span class="task-card__pomodoro">🍅 ${tarea.pomodoros_real || 0}/${tarea.pomodoros_est || 1} sesiones</span>
          ${!tarea.completada ? `<button class="task-play-btn" title="Iniciar Pomodoro">▶</button>` : '<span style="font-size:11px;color:var(--ok)">✓ Completada</span>'}
        </div>
      </div>`;
  }

  _esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // ── Render completo de la vista home ──────────────────────────────────────

  render() {
    this._renderHeaderStats();
    this.renderFiltros();
    this.renderTareas();
  }

  _renderHeaderStats() {
    const tareas = this._vm.getTareas();
    const total  = tareas.length;
    const urgent = tareas.filter(t => t.prioridad === 'Alta' && !t.completada).length;
    const hoy    = new Date().toDateString();
    const done   = tareas.filter(t => t.completada && t.fecha_limite && new Date(t.fecha_limite).toDateString() === hoy).length;

    if (this.$statTotal)  this.$statTotal.textContent  = total;
    if (this.$statUrgent) this.$statUrgent.textContent = urgent;
    if (this.$statDone)   this.$statDone.textContent   = done;
  }
}
