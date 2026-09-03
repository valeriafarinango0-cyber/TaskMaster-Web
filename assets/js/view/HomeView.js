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
    this.$nivelCard  = document.getElementById('nivel-card');
  }

  // ── Nivel por constancia + racha (gamificación) ───────────────────────────

  renderNivel(contenedor = this.$nivelCard) {
    if (!contenedor) return;
    const nivel = this._vm.getNivelUsuario();
    const racha = this._vm.getRacha();

    const siguienteTxt = nivel.siguiente
      ? `${nivel.faltan} tarea${nivel.faltan === 1 ? '' : 's'} más para <strong>${nivel.siguiente}</strong>`
      : 'Nivel máximo alcanzado';

    contenedor.innerHTML = `
      <div class="nivel-card__icon">${nivel.icono}</div>
      <div class="nivel-card__body">
        <div class="nivel-card__top">
          <span class="nivel-card__nombre">${nivel.nombre}</span>
          <span class="nivel-card__racha">🔥 ${racha} día${racha === 1 ? '' : 's'} seguido${racha === 1 ? '' : 's'}</span>
        </div>
        <div class="nivel-card__bar"><div class="nivel-card__bar-fill" style="width:${nivel.progreso}%"></div></div>
        <p class="nivel-card__siguiente">${siguienteTxt}</p>
      </div>`;
  }

  // ── Chips de filtro (estado + categorías propias) ─────────────────────────

  static DESCRIPCIONES = {
    todas:       { icono: '📋', texto: 'Todas tus tareas juntas, sin importar su estado. Útil para tener una vista general de todo lo que tienes registrado.' },
    pendientes:  { icono: '⏳', texto: 'Las tareas que todavía no has completado. Aquí es donde enfocas tu energía: qué sigue, qué se acerca y qué ya se atrasó.' },
    completadas: { icono: '✅', texto: 'Tu historial de tareas terminadas. Sirve para ver tu progreso real y recordar todo lo que ya lograste.' },
  };

  renderFiltros() {
    const activo = this._vm.getFiltroActivo();
    const categorias = this._vm.getCategorias();

    const estados = [
      { key: 'todas',       label: 'Todas' },
      { key: 'pendientes',  label: 'Pendientes' },
      { key: 'completadas', label: 'Completadas' },
    ];

    this.$filterRow.innerHTML = '';

    const crearWrap = (key, label, color) => {
      const wrap = document.createElement('div');
      wrap.className = 'chip-wrap';

      const dropdown = document.createElement('div');
      dropdown.className = 'chip-dropdown';
      wrap.appendChild(dropdown);

      wrap.addEventListener('mouseenter', () => this._poblarDropdown(dropdown, key, label));

      return wrap;
    };

    estados.forEach(e => {
      const wrap = crearWrap(e.key, e.label);
      const btn = document.createElement('button');
      btn.className = `chip ${activo === e.key ? 'chip--active' : ''}`;
      btn.dataset.filter = e.key;
      btn.textContent = e.label;
      wrap.prepend(btn);
      this.$filterRow.appendChild(wrap);
    });

    categorias.forEach(c => {
      const wrap = crearWrap(c.id, c.nombre, c.color);
      const btn = document.createElement('button');
      btn.className = `chip ${String(activo) === String(c.id) ? 'chip--active' : ''}`;
      btn.dataset.filter = c.id;
      btn.style.borderColor = c.color;
      if (String(activo) === String(c.id)) btn.style.color = c.color;
      btn.innerHTML = `<span class="chip-dot" style="background:${c.color}"></span>${c.icono || ''} ${c.nombre}`;
      wrap.prepend(btn);
      this.$filterRow.appendChild(wrap);
    });

    this.$filterRow.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this._vm.setFiltro(chip.dataset.filter);
        this.abrirDetalleCategoria(chip.dataset.filter);
      });
    });
  }

  _poblarDropdown(dropdown, key, label) {
    if (dropdown.dataset.listo) return;
    dropdown.dataset.listo = '1';

    const tareas = this._vm.getTareasPorFiltro(key);
    if (!tareas.length) {
      dropdown.innerHTML = `<p class="chip-dropdown__vacio">No tienes tareas en "${label}"</p>`;
      return;
    }
    dropdown.innerHTML = `<ul class="chip-dropdown__lista">${
      tareas.slice(0, 8).map(t => `<li>${t.titulo}</li>`).join('')
    }${tareas.length > 8 ? `<li class="chip-dropdown__mas">+${tareas.length - 8} más</li>` : ''}</ul>`;
  }

  // ── Panel de detalle al hacer click en un filtro/categoría ─────────────────

  abrirDetalleCategoria(key) {
    const $overlay = document.getElementById('modal-categoria-overlay');
    const $badge   = document.getElementById('categoria-detalle-badge');
    const $titulo  = document.getElementById('categoria-detalle-titulo');
    const $desc    = document.getElementById('categoria-detalle-desc');
    const $chart   = document.getElementById('categoria-detalle-chart');
    const $lista   = document.getElementById('categoria-detalle-lista');
    if (!$overlay) return;

    const categoria = HomeView.DESCRIPCIONES[key];
    let titulo, descripcion, icono, color;

    if (categoria) {
      titulo = key === 'todas' ? 'Todas' : key === 'pendientes' ? 'Pendientes' : 'Completadas';
      descripcion = categoria.texto;
      icono = categoria.icono;
      color = 'var(--accent-start)';
    } else {
      const cat = this._vm.getCategoriaById(key) || { nombre: 'Categoría', color: 'var(--accent-start)', icono: '📁' };
      titulo = cat.nombre;
      descripcion = `Agrupa aquí las tareas relacionadas con "${cat.nombre}". Te sirve para filtrar rápido y ver solo lo que corresponde a esta área de tu vida, sin mezclarlo con lo demás.`;
      icono = cat.icono || '📁';
      color = cat.color;
    }

    $badge.textContent = icono;
    $badge.style.background = color;
    $titulo.textContent = titulo;
    $desc.textContent = descripcion;

    const tareas = this._vm.getTareasPorFiltro(key);
    $chart.innerHTML = this._renderMiniChart(tareas);
    $lista.innerHTML = this._renderListaCategoria(tareas);

    $overlay.classList.add('open');
  }

  cerrarDetalleCategoria() {
    const $overlay = document.getElementById('modal-categoria-overlay');
    if ($overlay) $overlay.classList.remove('open');
  }

  _renderMiniChart(tareas) {
    const pendientes = tareas.filter(t => !t.completada);
    if (!pendientes.length) {
      return `<p class="mini-chart__vacio">No hay tiempo pendiente que mostrar aquí.</p>`;
    }

    const ahora = new Date();
    let vencidas = 0, hoy = 0, semana = 0, luego = 0;
    pendientes.forEach(t => {
      if (!t.fecha_limite) { luego++; return; }
      const dias = (new Date(t.fecha_limite) - ahora) / 86_400_000;
      if (dias < 0) vencidas++;
      else if (dias < 1) hoy++;
      else if (dias < 7) semana++;
      else luego++;
    });

    const total = pendientes.length;
    const barras = [
      { label: 'Vencidas',  valor: vencidas, color: 'var(--urgente)' },
      { label: 'Hoy',       valor: hoy,      color: 'var(--medio)' },
      { label: 'Esta semana', valor: semana, color: 'var(--accent-start)' },
      { label: 'Más adelante', valor: luego, color: 'var(--ok)' },
    ].filter(b => b.valor > 0);

    return `<div class="mini-chart">${
      barras.map(b => `
        <div class="mini-chart__fila">
          <span class="mini-chart__label">${b.label}</span>
          <div class="mini-chart__pista"><div class="mini-chart__barra" style="width:${(b.valor / total) * 100}%; background:${b.color}"></div></div>
          <span class="mini-chart__valor">${b.valor}</span>
        </div>`).join('')
    }</div>`;
  }

  _renderListaCategoria(tareas) {
    const pendientes = tareas.filter(t => !t.completada);
    if (!pendientes.length) {
      return `<p class="categoria-detalle-lista__vacio">No hay tareas pendientes aquí. 🎉</p>`;
    }
    return `<ul class="categoria-detalle-lista__items">${
      pendientes.map(t => {
        const { texto, clase } = this._etiquetaFecha(t.fecha_limite);
        return `<li><span>${t.titulo}</span><span class="vence-badge ${clase}">${texto}</span></li>`;
      }).join('')
    }</ul>`;
  }

  _etiquetaFecha(fecha) {
    if (typeof taskModel !== 'undefined' && taskModel.etiquetaFecha) return taskModel.etiquetaFecha(fecha);
    return { texto: '', clase: '' };
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
    this.renderNivel();
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
