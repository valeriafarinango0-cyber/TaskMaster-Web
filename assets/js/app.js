/**
 * APP.JS — Punto de entrada y coordinador principal
 * Instancia todas las Views, conecta los eventos globales
 * y suscribe las Views al ViewModel.
 */

class App {

  constructor() {
<<<<<<< HEAD
    this.homeView      = new HomeView(taskViewModel);
    this.semanaView    = new SemanaView(taskViewModel);
=======
    // Instanciar Views
    this.homeView      = new HomeView(taskViewModel);
    this.dashboardView = new DashboardView(taskViewModel);
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
    this.modalView     = new ModalView(taskViewModel);
    this.pomodoroView  = new PomodoroView(taskViewModel);
    this.authView      = new AuthView(this);

    this.user = null;
<<<<<<< HEAD
    this._vistaActual = 'home';
    this._taskExpirationNotified = new Set();

=======

    this._vistaActual  = 'home';

    this._taskExpirationNotified = new Set();
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
    this._bindGlobalEvents();
    this._subscribirViewModel();
    this._solicitarPermisoNotificaciones();
    this._iniciar();
    this._startTaskTimers();
  }

<<<<<<< HEAD
  // ── Carga inicial ─────────────────────────────────────────────────────────
  // La landing (hero, "Acerca de", contacto) siempre es pública. Solo el panel
  // de tareas requiere sesión: sin ella se muestra un llamado a crear cuenta
  // en lugar de la lista de tareas (mostrarModoInvitado).

  async _iniciar() {
    const haySesion = this.authView._restoreUser();
    if (haySesion) {
      await this._cargarPanel();
    } else {
      this.mostrarModoInvitado();
    }
  }

  /** Se llama desde AuthView tras un login/registro/Google exitoso. */
  async onAuthenticated() {
    await this._cargarPanel();
  }

  async _cargarPanel() {
    this._setUiInvitado(false);
    await taskViewModel.cargarTodo();
    this.homeView.render();
    this._iniciarSyncTiempoReal();
  }

  /** Estado público sin sesión: oculta datos personales y muestra el CTA de registro. */
  mostrarModoInvitado() {
    this._setUiInvitado(true);
  }

  _setUiInvitado(activo) {
    const homeCta    = document.getElementById('home-cta');
    const sectionHdr = document.getElementById('home-section-header');
    const filterRow  = document.getElementById('filter-row');
    const taskSec    = document.querySelector('.task-section');
    const headerSum  = document.querySelector('.header-summary');
    const nivelCard  = document.getElementById('nivel-card');
    const btnHero    = document.getElementById('btn-nueva-tarea');

    if (homeCta)    homeCta.classList.toggle('open', activo);
    if (sectionHdr) sectionHdr.style.display = activo ? 'none' : '';
    if (filterRow)  filterRow.style.display  = activo ? 'none' : '';
    if (taskSec)    taskSec.style.display    = activo ? 'none' : '';
    if (headerSum)  headerSum.style.display  = activo ? 'none' : '';
    if (btnHero)    btnHero.textContent      = activo ? '🚀 Comenzar gratis' : '+ Nueva tarea';

    if (activo && nivelCard) {
      nivelCard.innerHTML = `
        <div class="nivel-card__icon">🏆</div>
        <div class="nivel-card__body">
          <div class="nivel-card__top"><span class="nivel-card__nombre">Niveles y rachas</span></div>
          <p class="nivel-card__siguiente">Crea una cuenta para empezar a subir de nivel con cada tarea que completes.</p>
        </div>`;
    }
  }

  // ── Sincronización en tiempo real (Firestore, opcional) ─────────────────────
  // Otras pestañas/dispositivos escriben en Firestore al confirmar cada
  // create/update/delete via PHP; aquí escuchamos esos cambios y actualizamos
  // la UI sin recargar. Si Firestore no está disponible, no pasa nada — la
  // app sigue funcionando igual con PHP + localStorage.
  _iniciarSyncTiempoReal() {
    const suscribirse = () => {
      taskModel.subscribeRealtime(tareasActualizadas => {
        taskViewModel.aplicarActualizacionRemota(tareasActualizadas);
      });
    };
    if (window.__firebase) suscribirse();
    else window.addEventListener('firebase-ready', suscribirse, { once: true });
=======
  _startTaskTimers() {
    this._updateTaskTimers();
    this._taskTimerInterval = setInterval(() => this._updateTaskTimers(), 1000);
  }

  _updateTaskTimers() {
    const tareas = taskViewModel.getTareas();
    const ahora = Date.now();
    const mapa = new Map(tareas.map(t => [String(t.id), t]));

    document.querySelectorAll('.task-timer').forEach(el => {
      const id = String(el.dataset.id || '');
      const tarea = mapa.get(id);
      if (!tarea) return;

      const countdown = el.querySelector('.timer-countdown');
      if (!countdown) return;

      const diff = new Date(tarea.fecha_limite).getTime() - ahora;
      el.classList.remove('timer-urgent', 'timer-medium', 'timer-low', 'timer-blink');

      if (diff <= 0) {
        el.classList.add('timer-urgent');
        countdown.textContent = '¡Tiempo Expirado!';
        return;
      }

      const totalSec = Math.floor(diff / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;
      const hh = String(hours).padStart(2, '0');
      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');

      let texto = days > 0
        ? `Faltan ${days} días, ${hh}:${mm}:${ss}`
        : `Faltan ${hh}:${mm}:${ss}`;

      if (tarea.prioridad === 'Alta') {
        el.classList.add('timer-urgent');
        if (diff <= 3 * 3600 * 1000) {
          el.classList.add('timer-blink');
        }
        if (diff <= 3600 * 1000) {
          texto += ' ⚠️ Próxima a expirar';
        }
      } else if (tarea.prioridad === 'Media') {
        el.classList.add('timer-medium');
        if (diff <= 6 * 3600 * 1000) {
          texto += ' ⚠️ Próxima a vencer';
        }
      } else {
        el.classList.add('timer-low');
      }

      countdown.textContent = texto;
      this._maybeNotifyExpiration(tarea, diff);
    });
  }

  _maybeNotifyExpiration(tarea, diff) {
    if (tarea.completada || diff <= 0) return;

    const key = `${tarea.id}-${tarea.prioridad}`;
    if (tarea.prioridad === 'Alta' && diff <= 3600 * 1000 && !this._taskExpirationNotified.has(key)) {
      this._taskExpirationNotified.add(key);
      this.showToast(`¡Aviso! La tarea "${tarea.titulo}" está muy cerca de expirar`, 'warning');
      return;
    }

    if (tarea.prioridad === 'Media' && diff <= 2 * 3600 * 1000 && !this._taskExpirationNotified.has(key)) {
      this._taskExpirationNotified.add(key);
      this.showToast(`¡Aviso! La tarea "${tarea.titulo}" está muy cerca de expirar`, 'warning');
    }
  }

  _checkDueWarnings() {
    const tareas = taskViewModel.getTareas().filter(t => t.fecha_limite && !t.completada);
    const now = new Date();
    tareas.forEach(t => {
      const diff = new Date(t.fecha_limite) - now;
      const hrs = diff / 3_600_000;
      if (hrs <= 1 && hrs > 0) {
        this.showToast(`⚠ Tarea "${t.titulo}" vence en menos de 1 hora`, 'error');
      } else if (hrs <= 24 && hrs > 0) {
        this.showToast(`⏰ Tarea "${t.titulo}" vence en ${Math.floor(hrs)} horas`, 'warning');
      }
    });
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
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
<<<<<<< HEAD
          if (this._vistaActual === 'semana') this.semanaView.render();
=======
          if (this._vistaActual === 'overview') this.dashboardView.render();
          this._updateCountdown();
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
          this._checkDueWarnings();
          break;

        case 'filtroChanged':
          this.homeView.renderFiltros();
          this.homeView.renderTareas();
          break;

<<<<<<< HEAD
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
=======
        case 'tareaActivaChanged':
          const tarea = taskViewModel.getTareaActiva();
          if (tarea) {
            this.modalView.abrirDetalle(tarea);
            this.pomodoroView.iniciar(tarea);
          } else {
            this.pomodoroView.detener();
          }
          break;
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
      }
    });
  }

  // ── Eventos globales ──────────────────────────────────────────────────────

  _bindGlobalEvents() {
<<<<<<< HEAD
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const vista = btn.dataset.view;
        if (vista === 'semana' && !this.user) {
          this.showToast('Inicia sesión para ver tu progreso semanal', 'info');
          this.authView.openMode('login');
          return;
        }
        this._cambiarVista(vista);
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.dataset.scroll) {
          const el = document.getElementById(btn.dataset.scroll);
          if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
        }
      });
    });

    const linkAcercaDe = document.querySelector('a.top-nav__link[href="#acerca-de"]');
    if (linkAcercaDe) linkAcercaDe.addEventListener('click', e => {
      e.preventDefault();
      this._cambiarVista('home');
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === 'home'));
      const el = document.getElementById('acerca-de');
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    });

    const btnNew = document.getElementById('btn-nueva-tarea');
    if (btnNew) btnNew.addEventListener('click', () => {
      if (this.user) this.modalView.abrirNueva();
      else this.authView.openMode('register');
    });

    const btnFab = document.getElementById('btn-fab-nueva-tarea');
    if (btnFab) btnFab.addEventListener('click', () => {
      if (this.user) this.modalView.abrirNueva();
      else this.authView.openMode('register');
    });

    const btnCtaRegistro = document.getElementById('btn-cta-registro');
    if (btnCtaRegistro) btnCtaRegistro.addEventListener('click', () => this.authView.openMode('register'));
    const btnCtaLogin = document.getElementById('btn-cta-login');
    if (btnCtaLogin) btnCtaLogin.addEventListener('click', () => this.authView.openMode('login'));

    const btnAccount = document.getElementById('btn-account');
    if (btnAccount) btnAccount.addEventListener('click', () => {
      if (this.user) {
        this.mostrarPerfil();
      } else {
        this.authView.openMode('login');
      }
    });

    const btnCerrarPerfil = document.getElementById('btn-cerrar-perfil');
    if (btnCerrarPerfil) btnCerrarPerfil.addEventListener('click', () => this._cerrarPerfil());
    const perfilOverlay = document.getElementById('modal-perfil-overlay');
    if (perfilOverlay) perfilOverlay.addEventListener('click', e => { if (e.target === perfilOverlay) this._cerrarPerfil(); });
    const btnPerfilLogout = document.getElementById('btn-perfil-logout');
    if (btnPerfilLogout) btnPerfilLogout.addEventListener('click', () => {
      if (confirm('¿Cerrar sesión?')) {
        this._cerrarPerfil();
        this.authView.logout();
      }
    });

    const btnPrev = document.getElementById('btn-semana-prev');
    if (btnPrev) btnPrev.addEventListener('click', () => taskViewModel.moverSemana(-1));
    const btnNext = document.getElementById('btn-semana-next');
    if (btnNext) btnNext.addEventListener('click', () => taskViewModel.moverSemana(1));

=======
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
    const btnNew = document.getElementById('btn-nueva-tarea');
    if (btnNew) btnNew.addEventListener('click', () => {
      this.modalView.abrirNueva();
    });
    const btnFab = document.getElementById('btn-fab-nueva-tarea');
    if (btnFab) btnFab.addEventListener('click', () => {
      this.modalView.abrirNueva();
    });

    // Login buttons
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) btnLogin.addEventListener('click', () => this.authView.openMode('login'));
    const btnReg = document.getElementById('btn-registrarse');
    if (btnReg) btnReg.addEventListener('click', () => this.authView.openMode('register'));
    const btnHeroReg = document.getElementById('btn-hero-registrarse');
    if (btnHeroReg) btnHeroReg.addEventListener('click', () => this.authView.openMode('register'));
    const btnGoogle = document.getElementById('btn-google-login');
    if (btnGoogle) btnGoogle.addEventListener('click', () => this.authView.loginWithProvider('google'));
    const btnGateLogin = document.getElementById('btn-gate-login');
    if (btnGateLogin) btnGateLogin.addEventListener('click', () => this.authView.openMode('login'));
    const btnGateReg = document.getElementById('btn-gate-registrarse');
    if (btnGateReg) btnGateReg.addEventListener('click', () => this.authView.openMode('register'));
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) btnLogout.addEventListener('click', () => this.authView.logout());
    const btnCarga = document.getElementById('btn-carga-semanal');
    if (btnCarga) btnCarga.addEventListener('click', () => {
      this._cambiarVista('overview');
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      const nav = document.querySelector('.nav-btn[data-view="overview"]'); if (nav) nav.classList.add('active');
    });

    // Teclado: ESC cierra modales
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.modalView.cerrar();
        this.modalView.cerrarDetalle();
        this.pomodoroView.detener();
<<<<<<< HEAD
        this._cerrarPerfil();
=======
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
      }
    });
  }

<<<<<<< HEAD
=======
  // ── Cambio de vista ───────────────────────────────────────────────────────

>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
  _cambiarVista(vista) {
    this._vistaActual = vista;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const el = document.getElementById(`view-${vista}`);
    if (el) el.classList.add('active');

<<<<<<< HEAD
    if (vista === 'semana') this.semanaView.render();
    if (vista === 'home')   this.homeView.render();
  }

  setUser(user) {
    this.user = user;
    const label = document.getElementById('btn-account-label');
    if (label) label.textContent = user && user.nombre ? user.nombre : 'Iniciar sesión';
  }

  // ── Mi perfil: datos de la cuenta y lo que el usuario ha modificado ────────

  mostrarPerfil() {
    if (!this.user) return;
    const tareas = taskViewModel.getTareas();
    const completadas = tareas.filter(t => t.completada).length;
    const pomodoros = tareas.reduce((s, t) => s + (t.pomodoros_real || 0), 0);

    const avatar = document.getElementById('perfil-avatar');
    if (avatar) avatar.textContent = (this.user.nombre || this.user.email || '?').charAt(0);
    const nombre = document.getElementById('perfil-nombre');
    if (nombre) nombre.textContent = this.user.nombre || 'Sin nombre';
    const email = document.getElementById('perfil-email');
    if (email) email.textContent = this.user.email || '';

    const creadasEl = document.getElementById('perfil-creadas');
    if (creadasEl) creadasEl.textContent = tareas.length;
    const completadasEl = document.getElementById('perfil-completadas');
    if (completadasEl) completadasEl.textContent = completadas;
    const pomodorosEl = document.getElementById('perfil-pomodoros');
    if (pomodorosEl) pomodorosEl.textContent = pomodoros;
    const rachaEl = document.getElementById('perfil-racha');
    if (rachaEl) rachaEl.textContent = taskViewModel.getRacha();

    this.homeView.renderNivel(document.getElementById('perfil-nivel'));

    document.getElementById('modal-perfil-overlay').classList.add('open');
  }

  _cerrarPerfil() {
    document.getElementById('modal-perfil-overlay').classList.remove('open');
  }

  // ── Notificaciones del navegador (HU-04, sin cuenta requerida) ─────────────
=======
    if (vista === 'overview') this.dashboardView.render();
    if (vista === 'home')      this.homeView.render();
  }


  setUser(user) {
    this.user = user;
    const el = document.getElementById('header-welcome');
    if (el) el.textContent = user && user.nombre ? `Hola, ${user.nombre}` : 'Bienvenido';

    const loggedIn = ['btn-login', 'btn-registrarse', 'btn-google-login'];
    loggedIn.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.style.display = user ? 'none' : '';
    });
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) btnLogout.style.display = user ? '' : 'none';

    const hero = document.getElementById('hero-landing');
    if (hero) hero.style.display = user ? 'none' : '';

    // Gating: el flujo de trabajo (filtros, carga semanal, lista de tareas,
    // "Mi Panel", crear tarea) requiere sesión iniciada. La landing (hero,
    // paso a paso, acerca de) siempre queda visible.
    const workspace = ['home-panel', 'home-summary', 'task-section'];
    workspace.forEach(id => {
      const elWs = document.getElementById(id);
      if (elWs) elWs.style.display = user ? '' : 'none';
    });
    const gatePrompt = document.getElementById('gate-prompt');
    if (gatePrompt) gatePrompt.style.display = user ? 'none' : '';

    const navOverview = document.querySelector('.nav-btn[data-view="overview"]');
    if (navOverview) navOverview.style.display = user ? '' : 'none';

    const btnFab = document.getElementById('btn-fab-nueva-tarea');
    if (btnFab) btnFab.style.display = user ? '' : 'none';
    const btnNuevaTareaHeader = document.getElementById('btn-nueva-tarea');
    if (btnNuevaTareaHeader) btnNuevaTareaHeader.style.display = user ? '' : 'none';

    // Si cerró sesión estando en el panel (que ya no es accesible), volver a Inicio
    if (!user && this._vistaActual === 'overview') {
      this._cambiarVista('home');
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      const navHome = document.querySelector('.nav-btn[data-view="home"]');
      if (navHome) navHome.classList.add('active');
    }
  }

  _updateCountdown() {
    // Muestra el tiempo restante hasta la tarea más próxima
    const tareas = taskViewModel.getTareas().filter(t => t.fecha_limite && !t.completada);
    if (!tareas.length) {
      const el = document.getElementById('header-countdown'); if (el) el.textContent = '';
      return;
    }
    let proximas = tareas.map(t => ({ t, diff: new Date(t.fecha_limite) - new Date() }));
    proximas = proximas.filter(p => p.diff > 0);
    if (!proximas.length) { const el = document.getElementById('header-countdown'); if (el) el.textContent = 'No hay próximas tareas'; return; }
    proximas.sort((a,b) => a.diff - b.diff);
    const next = proximas[0];
    const ms = next.diff;
    const dias = Math.floor(ms / 86_400_000);
    const horas = Math.floor((ms % 86_400_000) / 3_600_000);
    const el = document.getElementById('header-countdown');
    if (el) el.textContent = `Próxima: ${next.t.titulo} — Falta ${dias}d ${horas}h`;
  }

  // ── Notificaciones del navegador ──────────────────────────────────────────
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50

  _solicitarPermisoNotificaciones() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

<<<<<<< HEAD
=======
  // ── Inicialización ────────────────────────────────────────────────────────

  async _iniciar() {
    await taskViewModel.cargarTareas();
    this.homeView.render();
  }

>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
  // ── Toast global ──────────────────────────────────────────────────────────

  showToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toast-container');
<<<<<<< HEAD
    const toast = document.createElement('div');
    toast.className = `toast toast--${tipo}`;
    toast.textContent = mensaje;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast--leaving');
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new App(); });
=======
    const toast     = document.createElement('div');
    toast.className = `toast toast--${tipo}`;
    toast.textContent = mensaje;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}

// Arrancar la app cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => { window.app = new App(); });

// PWA: registrar el service worker (habilita instalar la app y el modo offline)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.warn('No se pudo registrar el service worker:', err);
    });
  });
}
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
