/**
 * CAPA VIEW — PomodoroView.js
 * Pantalla 3: Modo Enfoque Pomodoro a pantalla completa.
 * Temporizador circular de 25 minutos por tarea, con registro de sesiones.
 */

class PomodoroView {

  constructor(viewModel) {
    this._vm = viewModel;

    this.$overlay  = document.getElementById('pomodoro-fullscreen');
    this.$subtitle = document.getElementById('pomodoro-fs-tarea');
    this.$time     = document.getElementById('fs-pomodoro-time');
    this.$label    = document.getElementById('fs-pomodoro-label');
    this.$ring     = document.getElementById('fs-ring-progress');
    this.$sessions = document.getElementById('fs-pomodoro-sessions');
    this.$btnClose = document.getElementById('btn-pomodoro-fs-close');
    this.$btnToggle= document.getElementById('btn-fs-pom-toggle');
    this.$btnReset = document.getElementById('btn-fs-pom-reset');
    this.$btnSkip  = document.getElementById('btn-fs-pom-skip');
    this.$statHoy   = document.getElementById('fs-stat-hoy');
    this.$statTarea = document.getElementById('fs-stat-tarea');
    this.$statTotal = document.getElementById('fs-stat-total');

    this._duracion    = 25 * 60;
    this._restantes   = this._duracion;
    this._intervalo    = null;
    this._corriendo    = false;
    this._tareaId      = null;
    this._tareaTitulo  = '';

    this._circunf = 2 * Math.PI * 170;
    this.$ring.style.strokeDasharray = this._circunf;

    this._bindEvents();
  }

  _bindEvents() {
    this.$btnClose.addEventListener('click', () => this.detener());
    this.$btnToggle.addEventListener('click', () => this._corriendo ? this._pausar() : this._iniciarConteo());
    this.$btnReset.addEventListener('click',  () => this.reset());
    this.$btnSkip.addEventListener('click',   () => this._completarSesion());
  }

  // ── Abrir pantalla de enfoque para una tarea ───────────────────────────────

  iniciar(tarea) {
    this._tareaId     = tarea.id;
    this._tareaTitulo = tarea.titulo;
    this.$subtitle.textContent = tarea.titulo;
    this.reset();
    this._renderSessions(tarea);
    this._renderStats(tarea);
    this.$overlay.classList.add('open');
  }

  _iniciarConteo() {
    if (this._restantes <= 0) this.reset();
    this._corriendo = true;
    this.$btnToggle.textContent = '⏸';
    this.$btnToggle.classList.add('running');
    this.$label.textContent = 'Enfocado';

    this._intervalo = setInterval(() => {
      this._restantes--;
      this._actualizarUI();
      if (this._restantes <= 0) {
        clearInterval(this._intervalo);
        this._completarSesion();
      }
    }, 1000);
  }

  _pausar() {
    clearInterval(this._intervalo);
    this._corriendo = false;
    this.$btnToggle.textContent = '▶';
    this.$btnToggle.classList.remove('running');
    this.$label.textContent = 'Pausado';
  }

  reset() {
    clearInterval(this._intervalo);
    this._corriendo = false;
    this._restantes = this._duracion;
    this.$btnToggle.textContent = '▶';
    this.$btnToggle.classList.remove('running');
    this.$label.textContent = 'Listo';
    this._actualizarUI();
  }

  async _completarSesion() {
    clearInterval(this._intervalo);
    this._corriendo = false;
    this.$btnToggle.classList.remove('running');

    if (this._tareaId) {
      await this._vm.registrarPomodoro(this._tareaId);
      this._incrementarContadorHoy();
      const tarea = this._vm.getTareas().find(t => t.id === this._tareaId);
      this._renderSessions(tarea);
      this._renderStats(tarea);
    }

    this._notificar('🍅 ¡Sesión completada!', `${this._tareaTitulo} — toma un descanso de 5 minutos.`);

    this._restantes = 5 * 60;
    this.$label.textContent = '☕ Descanso';
    this.$btnToggle.textContent = '▶';
    this._actualizarUI();
    if (window.app) app.showToast('¡Pomodoro completado! 🍅 Toma un descanso.', 'success');
  }

  _actualizarUI() {
    const min = Math.floor(this._restantes / 60).toString().padStart(2, '0');
    const seg = (this._restantes % 60).toString().padStart(2, '0');
    this.$time.textContent = `${min}:${seg}`;

    const progreso = this._restantes / this._duracion;
    const offset   = this._circunf * (1 - progreso);
    this.$ring.style.strokeDashoffset = offset;
  }

  _renderSessions(tarea) {
    if (!tarea) { this.$sessions.innerHTML = ''; return; }
    const total = tarea.pomodoros_est || 1;
    const hechas = tarea.pomodoros_real || 0;
    const dots = [];
    for (let i = 0; i < total; i++) {
      let cls = 'session-dot';
      if (i < hechas)        cls += ' done';
      else if (i === hechas) cls += ' active';
      dots.push(`<div class="${cls}"></div>`);
    }
    this.$sessions.innerHTML = dots.join('');
  }

  // ── Panel de estadísticas: Pomodoros hoy | Esta tarea | Tiempo total ──────

  _renderStats(tarea) {
    const hoy = this._contadorHoy();
    this.$statHoy.textContent   = hoy;
    this.$statTarea.textContent = tarea ? (tarea.pomodoros_real || 0) : 0;
    this.$statTotal.textContent = `${hoy * 25}m`;
  }

  _contadorHoy() {
    const data = JSON.parse(localStorage.getItem('tm_pomodoros_hoy') || 'null');
    const hoyStr = new Date().toDateString();
    if (!data || data.fecha !== hoyStr) return 0;
    return data.count;
  }

  _incrementarContadorHoy() {
    const hoyStr = new Date().toDateString();
    const actual = this._contadorHoy();
    localStorage.setItem('tm_pomodoros_hoy', JSON.stringify({ fecha: hoyStr, count: actual + 1 }));
  }

  _notificar(titulo, cuerpo) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(titulo, { body: cuerpo });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => {
        if (p === 'granted') new Notification(titulo, { body: cuerpo });
      });
    }
  }

  /** Cierra la pantalla de enfoque */
  detener() {
    clearInterval(this._intervalo);
    this._corriendo = false;
    this.$btnToggle.textContent = '▶';
    this.$btnToggle.classList.remove('running');
    this.$overlay.classList.remove('open');
    this._tareaId = null;
  }
}
