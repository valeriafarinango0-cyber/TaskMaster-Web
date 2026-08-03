/**
 * APP.JS — Punto de entrada y coordinador principal
 * Instancia todas las Views, conecta los eventos globales
 * y suscribe las Views al ViewModel.
 */

class App {

  constructor() {
    this.homeView      = new HomeView(taskViewModel);
    this.semanaView    = new SemanaView(taskViewModel);
    this.modalView     = new ModalView(taskViewModel);
    this.pomodoroView  = new PomodoroView(taskViewModel);
    this.authView      = new AuthView(this);

    this.user = null;
    this._vistaActual = 'home';
    this._taskExpirationNotified = new Set();

    this._bindGlobalEvents();
    this._subscribirViewModel();
    this._solicitarPermisoNotificaciones();
    this._iniciar();
    this._startTaskTimers();
  }

  // ── Carga inicial ─────────────────────────────────────────────────────────

  async _iniciar() {
    await taskViewModel.cargarTodo();
    this.homeView.render();
  }

  // ── Suscripción al ViewModel ──────────────────────────────────────────────

  _subscribirViewModel() {
    taskViewModel.subscribe((evento, estado) => {
      switch (evento) {

        case 'tareasActualizadas':
        case 'tareaCreada':
        case 'tareaActualizada':
        case 'tareaEliminada':
        case 'pomodoroRegistrado':
          this.homeView.render();
          if (this._vistaActual === 'semana') this.semanaView.render();
          this._checkDueWarnings();
          break;

        case 'filtroChanged':
          this.homeView.renderFiltros();
          this.homeView.renderTareas();
          break;

        case 'categoriaCreada':
          this.homeView.renderFiltros();
          break;

        case 'semanaChanged':
          this.semanaView.render();
          break;

        case 'tareaActivaChanged': {
          const tarea = taskViewModel.getTareaActiva();
          if (tarea) this.modalView.abrirDetalle(tarea);
          break;
        }
      }
    });
  }

  // ── Enfoque Pomodoro (Pantalla 3, a pantalla completa) ─────────────────────

  iniciarEnfoque(tarea) {
    this.pomodoroView.iniciar(tarea);
  }

  // ── Avisos de vencimiento próximo ───────────────────────────────────────────

  _checkDueWarnings() {
    const tareas = taskViewModel.getTareas().filter(t => t.fecha_limite && !t.completada);
    const ahora = new Date();
    tareas.forEach(t => {
      const diff = new Date(t.fecha_limite) - ahora;
      const key = `${t.id}-${t.prioridad}`;
      if (diff > 0 && diff <= 3600 * 1000 && !this._taskExpirationNotified.has(key)) {
        this._taskExpirationNotified.add(key);
        this.showToast(`⚠ "${t.titulo}" vence en menos de 1 hora`, 'warning');
      }
    });
  }

  // ── Cronómetros en vivo dentro de cada tarjeta ─────────────────────────────

  _startTaskTimers() {
    this._updateTaskTimers();
    this._taskTimerInterval = setInterval(() => this._updateTaskTimers(), 1000);
  }

  _updateTaskTimers() {
    const tareas = taskViewModel.getTareas();
    const ahora  = Date.now();
    const mapa   = new Map(tareas.map(t => [String(t.id), t]));

    document.querySelectorAll('.task-timer').forEach(el => {
      const tarea = mapa.get(String(el.dataset.id || ''));
      const countdown = el.querySelector('.timer-countdown');
      if (!tarea || !countdown || !tarea.fecha_limite) return;

      const diff = new Date(tarea.fecha_limite).getTime() - ahora;
      el.classList.remove('timer-urgent', 'timer-medium', 'timer-low', 'timer-blink');

      if (diff <= 0) {
        el.classList.add('timer-urgent');
        countdown.textContent = 'Vencida';
        return;
      }

      const totalSec = Math.floor(diff / 1000);
      const dias  = Math.floor(totalSec / 86400);
      const horas = Math.floor((totalSec % 86400) / 3600);
      const mins  = Math.floor((totalSec % 3600) / 60);
      const segs  = totalSec % 60;
      const hh = String(horas).padStart(2, '0');
      const mm = String(mins).padStart(2, '0');
      const ss = String(segs).padStart(2, '0');

      countdown.textContent = dias > 0 ? `Faltan ${dias} días, ${hh}:${mm}:${ss}` : `Faltan ${hh}:${mm}:${ss}`;

      if (tarea.prioridad === 'Alta') {
        el.classList.add('timer-urgent');
        if (diff <= 3 * 3600 * 1000) el.classList.add('timer-blink');
      } else if (tarea.prioridad === 'Media') {
        el.classList.add('timer-medium');
      } else {
        el.classList.add('timer-low');
      }
    });
  }

  // ── Eventos globales ──────────────────────────────────────────────────────

  _bindGlobalEvents() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const vista = btn.dataset.view;
        this._cambiarVista(vista);
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.dataset.scroll) {
          const el = document.getElementById(btn.dataset.scroll);
          if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
        }
      });
    });

    const btnNew = document.getElementById('btn-nueva-tarea');
    if (btnNew) btnNew.addEventListener('click', () => this.modalView.abrirNueva());

    const btnFab = document.getElementById('btn-fab-nueva-tarea');
    if (btnFab) btnFab.addEventListener('click', () => this.modalView.abrirNueva());

    const btnAccount = document.getElementById('btn-account');
    if (btnAccount) btnAccount.addEventListener('click', () => {
      if (this.user) {
        if (confirm('¿Cerrar sesión?')) this.authView.logout();
      } else {
        this.authView.openMode('login');
      }
    });

    const btnPrev = document.getElementById('btn-semana-prev');
    if (btnPrev) btnPrev.addEventListener('click', () => taskViewModel.moverSemana(-1));
    const btnNext = document.getElementById('btn-semana-next');
    if (btnNext) btnNext.addEventListener('click', () => taskViewModel.moverSemana(1));

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.modalView.cerrar();
        this.modalView.cerrarDetalle();
        this.pomodoroView.detener();
      }
    });
  }

  _cambiarVista(vista) {
    this._vistaActual = vista;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const el = document.getElementById(`view-${vista}`);
    if (el) el.classList.add('active');

    if (vista === 'semana') this.semanaView.render();
    if (vista === 'home')   this.homeView.render();
  }

  setUser(user) {
    this.user = user;
    const btn = document.getElementById('btn-account');
    if (btn) btn.textContent = user && user.nombre ? user.nombre : 'Invitado';
  }

  // ── Notificaciones del navegador (HU-04, sin cuenta requerida) ─────────────

  _solicitarPermisoNotificaciones() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // ── Toast global ──────────────────────────────────────────────────────────

  showToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast--${tipo}`;
    toast.textContent = mensaje;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new App(); });
