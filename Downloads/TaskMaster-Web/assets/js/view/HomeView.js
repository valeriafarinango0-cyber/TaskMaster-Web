/**
 * CAPA VIEW — HomeView.js
 * Renderiza la pantalla principal: barra semanal, filtros y lista de tareas.
 * Solo manipula el DOM. No contiene lógica de negocio.
 */

class HomeView {

  constructor(viewModel) {
    this._vm = viewModel;

    // Referencias DOM
    this.$weeklyChart = document.getElementById('weekly-chart');
    this.$cargaBadge  = document.getElementById('carga-badge');
    this.$filterRow   = document.getElementById('filter-row');
    this.$taskList    = document.getElementById('task-list');
  }

  // ── Barra de carga semanal ────────────────────────────────────────────────

  renderWeeklyBar() {
    const { porDia } = this._vm.getDatosDashboard();
    const MAX = 6;

    this.$weeklyChart.innerHTML = porDia.map(({ dia, tareas, esHoy }) => {
      const n         = tareas.length;
      const pct       = Math.min(100, Math.round((n / MAX) * 100));
      const heightPx  = Math.max(4, Math.round((pct / 100) * 52));
      let cls = 'weekly-col--low';
      if (n >= MAX)   cls = 'weekly-col--overload';
      else if (n >= 4) cls = 'weekly-col--high';
      else if (n >= 2) cls = 'weekly-col--normal';

      return `
        <div class="weekly-col ${cls}">
          <div class="weekly-bar-fill" style="height:${heightPx}px"></div>
          <span class="weekly-col-label">${esHoy ? `<b>${dia}</b>` : dia}</span>
        </div>`;
    }).join('');

    // Badge de nivel de carga
    const maxDia = Math.max(...porDia.map(d => d.tareas.length));
    if (maxDia >= MAX) {
      this.$cargaBadge.textContent = 'Alta';
      this.$cargaBadge.className   = 'badge badge--danger';
    } else if (maxDia >= 3) {
      this.$cargaBadge.textContent = 'Media';
      this.$cargaBadge.className   = 'badge badge--warning';
    } else {
      this.$cargaBadge.textContent = 'Normal';
      this.$cargaBadge.className   = 'badge badge--success';
    }
  }

  // ── Chips de filtro por materia ───────────────────────────────────────────

  renderFiltros() {
    const materias = this._vm.getMaterias();
    const activo   = this._vm.getFiltroActivo();

    this.$filterRow.innerHTML = `
      <button class="chip ${activo === 'todas' ? 'chip--active' : ''}" data-filter="todas">
        Todas
      </button>
      ${materias.map(m => `
        <button class="chip ${activo === String(m.id) ? 'chip--active' : ''}"
                data-filter="${m.id}"
                style="${activo === String(m.id) ? `background:${m.color};border-color:${m.color}` : `border-color:${m.color};color:${m.color}`}">
          <span class="chip-dot" style="background:${m.color}"></span>
          ${m.nombre}
        </button>`).join('')}
    `;

    // Eventos de los chips
    this.$filterRow.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this._vm.setFiltro(chip.dataset.filter);
      });
    });
  }

  // ── Lista de tareas ───────────────────────────────────────────────────────

  renderTareas() {
    const tareas = this._vm.getTareasFiltradas();

    if (!tareas.length) {
      this.$taskList.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">📋</span>
          <p class="empty-state__text">No hay tareas. ¡Toca + para agregar una!</p>
        </div>`;
      return;
    }

    // Ordenar: incompletas primero, luego por fecha
    const ordenadas = [...tareas].sort((a, b) => {
      if (a.completada !== b.completada) return a.completada - b.completada;
      return new Date(a.fecha_limite) - new Date(b.fecha_limite);
    });

    this.$taskList.innerHTML = ordenadas.map(t => this._renderCard(t)).join('');

    // Eventos en las tarjetas
    this.$taskList.querySelectorAll('.task-card').forEach(card => {
      const id = Number(card.dataset.id);
      card.addEventListener('click', e => {
        // Botón play → abrir detalle con Pomodoro
        if (e.target.closest('.task-play-btn')) return;
        const tarea = this._vm.getTareas().find(t => t.id === id);
        if (tarea) this._vm.setTareaActiva(tarea);
      });
      const playBtn = card.querySelector('.task-play-btn');
      if (playBtn) {
        playBtn.addEventListener('click', e => {
          e.stopPropagation();
          const tarea = this._vm.getTareas().find(t => t.id === id);
          if (tarea) this._vm.setTareaActiva(tarea);
        });
      }
    });
  }

  // ── Render de una tarjeta ─────────────────────────────────────────────────

  _renderCard(tarea) {
    const materia  = this._vm.getMateriaById(tarea.materia_id);
    const { texto: fechaTxt, clase: fechaCls } = this._vm.etiquetaFecha(tarea.fecha_limite);
    const urgencia = this._vm.calcularUrgencia(tarea.fecha_limite);
    const prioColor = { Alta: 'task-card--alta', Media: 'task-card--media', Baja: 'task-card--baja' };
    const urgClass  = { Alta: 'urgency-bar__fill--alta', Media: 'urgency-bar__fill--media', Baja: 'urgency-bar__fill--baja' };
    const done = tarea.completada ? 'task-card--done' : '';

    return `
      <div class="task-card ${prioColor[tarea.prioridad] || ''} ${done}"
           data-id="${tarea.id}">
        <div class="task-card__top">
          <span class="task-card__title">${tarea.titulo}</span>
          <span class="task-card__vence ${fechaCls}">⏰ ${fechaTxt}</span>
        </div>
        <div class="task-card__meta">
          <span class="materia-pill" style="background:${materia.bg};color:${materia.color}">
            <span class="materia-pill__dot" style="background:${materia.color}"></span>
            ${materia.nombre}
          </span>
          <span class="badge ${tarea.prioridad === 'Alta' ? 'badge--danger' : tarea.prioridad === 'Media' ? 'badge--warning' : 'badge--success'}">
            ${tarea.prioridad}
          </span>
        </div>
        <div class="urgency-bar">
          <div class="urgency-bar__fill ${urgClass[tarea.prioridad] || ''}"
               style="width:${urgencia}%"></div>
        </div>
        <div class="task-card__footer">
          <span class="task-card__pomodoro">
            🍅 ${tarea.pomodoros_real || 0}/${tarea.pomodoros_est || 1} sesiones
          </span>
          ${!tarea.completada ? `<button class="task-play-btn" title="Iniciar enfoque">▶</button>` : '<span style="font-size:11px;color:var(--color-baja)">✓ Completada</span>'}
        </div>
      </div>`;
  }

  // ── Render completo de la vista home ──────────────────────────────────────

  render() {
    this.renderWeeklyBar();
    this.renderFiltros();
    this.renderTareas();
  }
}
