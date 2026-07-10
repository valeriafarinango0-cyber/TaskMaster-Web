/**
 * APP.JS — Punto de entrada y coordinador principal
 * Instancia todas las Views, conecta los eventos globales
 * y suscribe las Views al ViewModel.
 */

class App {

  constructor() {
    // Instanciar Views
    this.homeView      = new HomeView(taskViewModel);
    this.dashboardView = new DashboardView(taskViewModel);
    this.modalView     = new ModalView(taskViewModel);
    this.pomodoroView  = new PomodoroView(taskViewModel);

    this._vistaActual  = 'home';

    this._bindGlobalEvents();
    this._subscribirViewModel();
    this._solicitarPermisoNotificaciones();
    this._iniciar();
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
          if (this._vistaActual === 'dashboard') this.dashboardView.render();
          break;

        case 'filtroChanged':
          this.homeView.renderFiltros();
          this.homeView.renderTareas();
          break;

        case 'tareaActivaChanged':
          const tarea = taskViewModel.getTareaActiva();
          if (tarea) {
            this.modalView.abrirDetalle(tarea);
            this.pomodoroView.iniciar(tarea);
          } else {
            this.pomodoroView.detener();
          }
          break;
      }
    });
  }

  // ── Eventos globales ──────────────────────────────────────────────────────

  _bindGlobalEvents() {
    // Navegación entre vistas
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const vista = btn.dataset.view;
        this._cambiarVista(vista);
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // FAB: abrir modal nueva tarea
    document.getElementById('btn-nueva-tarea').addEventListener('click', () => {
      this.modalView.abrirNueva();
    });

    // Teclado: ESC cierra modales
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.modalView.cerrar();
        this.modalView.cerrarDetalle();
        this.pomodoroView.detener();
      }
    });
  }

  // ── Cambio de vista ───────────────────────────────────────────────────────

  _cambiarVista(vista) {
    this._vistaActual = vista;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${vista}`).classList.add('active');

    if (vista === 'dashboard') this.dashboardView.render();
    if (vista === 'home')      this.homeView.render();
  }

  // ── Notificaciones del navegador ──────────────────────────────────────────

  _solicitarPermisoNotificaciones() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // ── Inicialización ────────────────────────────────────────────────────────

  async _iniciar() {
    await taskViewModel.cargarTareas();
    this.homeView.render();
  }

  // ── Toast global ──────────────────────────────────────────────────────────

  showToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toast-container');
    const toast     = document.createElement('div');
    toast.className = `toast toast--${tipo}`;
    toast.textContent = mensaje;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}

// Arrancar la app cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => { window.app = new App(); });
