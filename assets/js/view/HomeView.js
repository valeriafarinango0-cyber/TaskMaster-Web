/**
 * CAPA VIEW — HomeView.js
<<<<<<< HEAD
 * Renderiza la pantalla principal: resumen, filtros por categoría y lista de tareas.
=======
 * Renderiza la pantalla principal: barra semanal, filtros y lista de tareas.
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
 * Solo manipula el DOM. No contiene lógica de negocio.
 */

class HomeView {

  constructor(viewModel) {
    this._vm = viewModel;

<<<<<<< HEAD
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

=======
    // Referencias DOM
    this.$weeklyChart = document.getElementById('weekly-chart');
    this.$cargaBadge  = document.getElementById('carga-badge');
    this.$filterRow   = document.getElementById('filter-row');
    this.$taskList    = document.getElementById('task-list');
    this.$specialSelect = document.getElementById('special-filter');
    this.$statTotal   = document.getElementById('stat-total');
    this.$statUrgent  = document.getElementById('stat-urgent');
    this.$statDone    = document.getElementById('stat-done');

    // Estado de acordeones expandidos
    this._expandedAccordions = new Set();

    if (this.$specialSelect) {
      this.$specialSelect.addEventListener('change', () => {
        this._vm.setFiltro(this.$specialSelect.value);
      });
    }
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

  static CATEGORY_ICONS = {
    'Trabajo': '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="7" width="14" height="9" rx="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M7 7V5.5C7 4.67157 7.67157 4 8.5 4H11.5C12.3284 4 13 4.67157 13 5.5V7" stroke="currentColor" stroke-width="1.6"/><path d="M3 11H17" stroke="currentColor" stroke-width="1.6"/></svg>',
    'Estudio': '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4.5C4 3.67157 4.67157 3 5.5 3H10V17H5.5C4.67157 17 4 16.3284 4 15.5V4.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M16 4.5C16 3.67157 15.3284 3 14.5 3H10V17H14.5C15.3284 17 16 16.3284 16 15.5V4.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    'Personal': '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="6.5" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 17C3.5 13.9624 6.46243 11.5 10 11.5C13.5376 11.5 16.5 13.9624 16.5 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    'Bienestar': '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 17S3 12.5 3 7.8C3 5.7 4.7 4 6.8 4C8 4 9.2 4.6 10 5.6C10.8 4.6 12 4 13.2 4C15.3 4 17 5.7 17 7.8C17 12.5 10 17 10 17Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    'Recados': '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 7H15L14.3 16.5C14.25 17.15 13.7 17.65 13.05 17.65H6.95C6.3 17.65 5.75 17.15 5.7 16.5L5 7Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.5 7V5.5C7.5 4.11929 8.61929 3 10 3C11.3807 3 12.5 4.11929 12.5 5.5V7" stroke="currentColor" stroke-width="1.6"/></svg>',
    'Planificación': '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4.5" width="14" height="12" rx="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M3 8H17" stroke="currentColor" stroke-width="1.6"/><path d="M7 3V5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M13 3V5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    'Otros': '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="10" r="1.6" fill="currentColor"/><circle cx="10" cy="10" r="1.6" fill="currentColor"/><circle cx="15" cy="10" r="1.6" fill="currentColor"/></svg>',
  };

  static ICON_TODAS = '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.6"/><rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.6"/><rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.6"/></svg>';

  static CATEGORY_METADATA = {
    'Trabajo': {
      tips: [
        'Prioriza las 3 tareas más importantes cada día',
        'Usa bloques de tiempo ininterrumpido para trabajo profundo',
        'Revisa emails en horarios específicos, no continuamente'
      ],
      ejemplos: [
        { titulo: 'Revisar emails', descripcion: 'Revisar y responder correos importantes' },
        { titulo: 'Reunión de equipo', descripcion: 'Sincronización con el equipo' },
        { titulo: 'Preparar presentación', descripcion: 'Diseñar y revisar diapositivas' },
        { titulo: 'Entregar documento', descripcion: 'Finalizar y enviar documento' }
      ]
    },
    'Estudio': {
      tips: [
        'Divide sesiones en bloques Pomodoro de 25 minutos',
        'Toma descansos de 5 minutos entre bloques',
        'Revisa la materia un día antes de examen o evaluación'
      ],
      ejemplos: [
        { titulo: 'Leer capítulo', descripcion: 'Lectura de contenido asignado' },
        { titulo: 'Resolver ejercicios', descripcion: 'Práctica de problemas' },
        { titulo: 'Preparar examen', descripcion: 'Repasar temas clave' },
        { titulo: 'Hacer proyecto', descripcion: 'Desarrollo del proyecto académico' }
      ]
    },
    'Personal': {
      tips: [
        'Programa tiempo para ti y actividades que disfrutes',
        'Equilibra obligaciones con descanso y ocio',
        'Revisa tus objetivos personales semanalmente'
      ],
      ejemplos: [
        { titulo: 'Llamar a familia', descripcion: 'Mantener contacto con seres queridos' },
        { titulo: 'Leer un libro', descripcion: 'Tiempo de lectura y relajación' },
        { titulo: 'Arreglar algo en casa', descripcion: 'Mantenimiento del hogar' },
        { titulo: 'Organizar espacio', descripcion: 'Organización y limpieza' }
      ]
    },
    'Bienestar': {
      tips: [
        'Ejercita al menos 30 minutos diarios',
        'Prioriza dormir 7-8 horas cada noche',
        'Dedica tiempo a meditación o actividades que calmen'
      ],
      ejemplos: [
        { titulo: 'Ir al gimnasio', descripcion: 'Rutina de ejercicio' },
        { titulo: 'Meditar', descripcion: 'Sesión de meditación' },
        { titulo: 'Caminar', descripcion: 'Paseo al aire libre' },
        { titulo: 'Stretching', descripcion: 'Ejercicios de flexibilidad' }
      ]
    },
    'Recados': {
      tips: [
        'Agrupa recados por ubicación para ahorrar tiempo',
        'Dedica un día a la semana para recados',
        'Planifica rutas eficientes antes de salir'
      ],
      ejemplos: [
        { titulo: 'Comprar groceries', descripcion: 'Ir al supermercado' },
        { titulo: 'Pagar servicios', descripcion: 'Pagar cuentas y servicios' },
        { titulo: 'Ir al banco', descripcion: 'Trámites bancarios' },
        { titulo: 'Entregar paquete', descripcion: 'Enviar o recoger paquete' }
      ]
    },
    'Planificación': {
      tips: [
        'Planifica tu semana cada lunes o domingo',
        'Revisa tus objetivos cada mes',
        'Ajusta planes según cambios en prioridades'
      ],
      ejemplos: [
        { titulo: 'Planificar semana', descripcion: 'Revisar y organizar tareas semanales' },
        { titulo: 'Definir objetivos', descripcion: 'Establecer metas mensuales o trimestrales' },
        { titulo: 'Revisar progreso', descripcion: 'Evaluar avance en proyectos' },
        { titulo: 'Actualizar lista', descripcion: 'Revisar y actualizar prioridades' }
      ]
    },
    'Otros': {
      tips: [
        'Categoriza mejor tus tareas para mejor organización',
        'Usa las categorías principales para agrupar trabajo',
        'Revisa esta sección regularmente'
      ],
      ejemplos: [
        { titulo: 'Tarea pendiente', descripcion: 'Tareas sin categoría' },
        { titulo: 'Proyecto especial', descripcion: 'Proyectos únicos o especiales' },
        { titulo: 'Idea para después', descripcion: 'Guardar para considerar luego' },
        { titulo: 'Seguimiento', descripcion: 'Revisiones y seguimientos' }
      ]
    }
  };

  renderFiltros() {
    const activo = this._vm.getFiltroActivo();
    const cats = this._vm.getGeneralCategories();

    this.$filterRow.innerHTML = '';

    // Botón "Todas"
    const todasBtn = document.createElement('button');
    todasBtn.className = `chip ${activo === 'todas' ? 'chip--active' : ''}`;
    todasBtn.dataset.filter = 'todas';
    todasBtn.innerHTML = `<span class="chip-icon">${HomeView.ICON_TODAS}</span>Todas`;
    this.$filterRow.appendChild(todasBtn);

    todasBtn.addEventListener('click', () => {
      this._vm.setFiltro('todas');
      if (this.$specialSelect) this.$specialSelect.value = 'todas';
    });

    // Categorías con acordeones
    cats.forEach(c => {
      const container = document.createElement('div');
      container.className = 'category-group';

      // Chip de categoría
      const btn = document.createElement('button');
      btn.className = `chip ${activo === 'general:' + c.key ? 'chip--active' : ''}`;
      btn.dataset.filter = 'general:' + c.key;
      btn.dataset.category = c.key;
      btn.style.borderColor = this._vm.getCategoryColor(c.key);
      btn.style.color = this._vm.getCategoryColor(c.key);
      const icon = HomeView.CATEGORY_ICONS[c.key] || HomeView.ICON_TODAS;
      const toggleIcon = '<svg class="accordion-toggle" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 8l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      btn.innerHTML = `<span class="chip-icon">${icon}</span>${c.label}<span class="chip-toggle">${toggleIcon}</span>`;
      container.appendChild(btn);

      // Acordeón con tips y ejemplos
      const accordion = document.createElement('div');
      accordion.className = 'category-accordion';
      accordion.dataset.category = c.key;

      const metadata = HomeView.CATEGORY_METADATA[c.key];
      if (metadata) {
        // Tips
        const tipsHtml = `
          <div class="accordion-tips">
            <h4>💡 Consejos</h4>
            <ul>
              ${metadata.tips.map(tip => `<li>${HomeView._escapeHtml(tip)}</li>`).join('')}
            </ul>
          </div>`;
        accordion.innerHTML += tipsHtml;

        // Ejemplos de tareas
        const ejemplosHtml = `
          <div class="accordion-ejemplos">
            <h4>📌 Ejemplos rápidos</h4>
            <div class="ejemplos-grid">
              ${metadata.ejemplos.map((ej, idx) => `
                <button class="ejemplo-btn" data-titulo="${HomeView._escapeHtml(ej.titulo)}" data-desc="${HomeView._escapeHtml(ej.descripcion)}" data-cat="${c.key}">
                  + ${HomeView._escapeHtml(ej.titulo)}
                </button>
              `).join('')}
            </div>
          </div>`;
        accordion.innerHTML += ejemplosHtml;
      }

      container.appendChild(accordion);
      this.$filterRow.appendChild(container);

      // Eventos
      btn.addEventListener('click', (e) => {
        // No abrir modal si hacen clic en el toggle
        if (e.target.closest('.chip-toggle')) {
          e.preventDefault();
          this._toggleAccordion(c.key);
          return;
        }

        this._vm.setFiltro(btn.dataset.filter);
        if (this.$specialSelect) this.$specialSelect.value = 'todas';
      });

      // Toggle del acordeón al hacer clic en el icono
      const toggleBtn = btn.querySelector('.chip-toggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this._toggleAccordion(c.key);
        });
      }
    });

    // Eventos para botones de ejemplos
    this.$filterRow.querySelectorAll('.ejemplo-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const titulo = btn.dataset.titulo;
        const desc = btn.dataset.desc;
        const cat = btn.dataset.cat;
        if (window.app && window.app.modalView) {
          const defaults = {
            titulo,
            descripcion: desc,
            general_categoria: cat
          };
          window.app.modalView.abrirNueva(defaults);
        }
      });
    });
  }

  _toggleAccordion(categoryKey) {
    if (this._expandedAccordions.has(categoryKey)) {
      this._expandedAccordions.delete(categoryKey);
    } else {
      this._expandedAccordions.add(categoryKey);
    }

    const accordion = this.$filterRow.querySelector(`.category-accordion[data-category="${categoryKey}"]`);
    if (accordion) {
      accordion.classList.toggle('open');
    }

    const toggle = this.$filterRow.querySelector(`.chip[data-category="${categoryKey}"] .chip-toggle`);
    if (toggle) {
      toggle.classList.toggle('rotated');
    }
  }

>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
  // ── Lista de tareas ───────────────────────────────────────────────────────

  renderTareas() {
    const tareas = this._vm.getTareasFiltradas();

    if (!tareas.length) {
      this.$taskList.innerHTML = `
        <div class="empty-state">
<<<<<<< HEAD
          <span class="empty-state__icon">📋</span>
          <p class="empty-state__text">No hay tareas aquí. ¡Toca + para agregar una!</p>
=======
          <img src="assets/img/empty-state.jpg" alt="Sin tareas pendientes" class="empty-state__photo" />
          <p class="empty-state__text">No hay tareas. ¡Toca + para agregar una!</p>
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
        </div>`;
      return;
    }

<<<<<<< HEAD
=======
    // Ordenar: incompletas primero, luego por fecha
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
    const ordenadas = [...tareas].sort((a, b) => {
      if (a.completada !== b.completada) return a.completada - b.completada;
      return new Date(a.fecha_limite) - new Date(b.fecha_limite);
    });

    this.$taskList.innerHTML = ordenadas.map(t => this._renderCard(t)).join('');

<<<<<<< HEAD
    this.$taskList.querySelectorAll('.task-card').forEach(card => {
      const id = Number(card.dataset.id);
      card.addEventListener('click', e => {
=======
    // Eventos en las tarjetas
    this.$taskList.querySelectorAll('.task-card').forEach(card => {
      const id = Number(card.dataset.id);
      card.addEventListener('click', e => {
        // Botón play → abrir detalle con Pomodoro
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
        if (e.target.closest('.task-play-btn')) return;
        const tarea = this._vm.getTareas().find(t => t.id === id);
        if (tarea) this._vm.setTareaActiva(tarea);
      });
      const playBtn = card.querySelector('.task-play-btn');
      if (playBtn) {
        playBtn.addEventListener('click', e => {
          e.stopPropagation();
          const tarea = this._vm.getTareas().find(t => t.id === id);
<<<<<<< HEAD
          if (tarea) app.iniciarEnfoque(tarea);
=======
          if (tarea) this._vm.setTareaActiva(tarea);
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
        });
      }
    });
  }

<<<<<<< HEAD
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
=======
  // ── Render de una tarjeta ─────────────────────────────────────────────────

  static _escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));
  }

  // ── Indicador de estado (único icono por tarjeta) ─────────────────────────
  // Verde = completada · Rojo = urgente o vencida · Gris = pendiente normal
  static ESTADO_ICONS = {
    completada: '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="9" fill="currentColor" fill-opacity="0.16"/><path d="M6 10.5l2.5 2.5L14.5 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    alerta: '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="9" fill="currentColor" fill-opacity="0.16"/><path d="M10 6v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="10" cy="13.6" r="1" fill="currentColor"/></svg>',
    pendiente: '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="7.2" stroke="currentColor" stroke-width="1.6"/></svg>',
  };

  /** Determina el estado visual único de la tarjeta: completada, alerta (urgente/vencida) o pendiente */
  _estadoTarea(tarea) {
    if (tarea.completada) return { clave: 'completada', color: 'var(--ok)', titulo: 'Completada' };
    const vencida = new Date(tarea.fecha_limite) < new Date();
    if (vencida || tarea.prioridad === 'Alta') {
      return { clave: 'alerta', color: 'var(--urgente)', titulo: vencida ? 'Vencida' : 'Urgente' };
    }
    return { clave: 'pendiente', color: 'var(--muted)', titulo: 'Pendiente' };
  }

  _renderCard(tarea) {
    const catColor = this._vm.getCategoryColor(this._vm.getGeneralCategory(tarea));
    const { texto: fechaTxt, clase: fechaCls } = this._vm.etiquetaFecha(tarea.fecha_limite);
    const done = tarea.completada ? 'task-card--done' : '';
    const tituloSeguro = HomeView._escapeHtml(tarea.titulo);
    const estado = this._estadoTarea(tarea);

    return `
      <div class="task-card ${done}"
           data-id="${tarea.id}" style="border-left:4px solid ${catColor}">
        <div class="task-card__top">
          <span class="task-card__status" style="color:${estado.color}" title="${estado.titulo}">${HomeView.ESTADO_ICONS[estado.clave]}</span>
          <span class="task-card__title">${tituloSeguro}</span>
          <span class="task-card__vence ${fechaCls}">⏰ ${fechaTxt}</span>
        </div>
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
        <div class="task-timer" data-id="${tarea.id}">
          <i class="clock-icon">🕒</i>
          <span class="timer-countdown">Calculando...</span>
        </div>
<<<<<<< HEAD
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

=======
        ${!tarea.completada ? `
        <div class="task-card__footer">
          <button class="task-play-btn" title="Iniciar enfoque">▶</button>
        </div>` : ''}
      </div>`;
  }

>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
  // ── Render completo de la vista home ──────────────────────────────────────

  render() {
    this._renderHeaderStats();
<<<<<<< HEAD
    this.renderNivel();
    this.renderFiltros();
=======
    this.renderWeeklyBar();
    this.renderFiltros();
    if (this.$specialSelect) {
      this.$specialSelect.value = this._vm.getFiltroActivo().startsWith('especial:') ? this._vm.getFiltroActivo() : 'todas';
    }
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
    this.renderTareas();
  }

  _renderHeaderStats() {
    const tareas = this._vm.getTareas();
<<<<<<< HEAD
    const total  = tareas.length;
    const urgent = tareas.filter(t => t.prioridad === 'Alta' && !t.completada).length;
    const hoy    = new Date().toDateString();
    const done   = tareas.filter(t => t.completada && t.fecha_limite && new Date(t.fecha_limite).toDateString() === hoy).length;

    if (this.$statTotal)  this.$statTotal.textContent  = total;
    if (this.$statUrgent) this.$statUrgent.textContent = urgent;
    if (this.$statDone)   this.$statDone.textContent   = done;
=======
    const total   = tareas.length;
    const urgent  = tareas.filter(t => t.prioridad === 'Alta' && !t.completada).length;
    const done    = tareas.filter(t => t.completada).length;

    if (this.$statTotal) this.$statTotal.textContent = total;
    if (this.$statUrgent) this.$statUrgent.textContent = urgent;
    if (this.$statDone) this.$statDone.textContent = done;
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
  }
}
