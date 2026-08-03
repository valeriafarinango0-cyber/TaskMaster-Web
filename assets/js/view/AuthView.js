class AuthView {
  constructor(app) {
    this.app = app;
    this.$overlay = document.getElementById('modal-auth-overlay');
    this.$form = document.getElementById('form-auth');
    this.$nombre = document.getElementById('auth-nombre');
    this.$email = document.getElementById('auth-email');
    this.$password = document.getElementById('auth-password');
    this.$btnClose = document.getElementById('btn-cerrar-auth');
    this.$btnSwitch = document.getElementById('btn-switch-auth');
    this.$modeLabel = document.getElementById('auth-mode-label');
    this.$title = document.getElementById('auth-title');
    this.$submit = document.getElementById('btn-auth-submit');

    this.mode = 'login'; // or 'register'

    this._bind();
    this._restoreUser();
  }

  _bind() {
    // Triggered from App: open(mode) will be used. Keep bind for safety.
    this.$btnClose.addEventListener('click', () => this.close());
    this.$overlay.addEventListener('click', e => { if (e.target === this.$overlay) this.close(); });
    this.$btnSwitch.addEventListener('click', () => this._toggleMode());
    this.$form.addEventListener('submit', e => { e.preventDefault(); this._submit(); });
    const btnGoogleModal = document.getElementById('btn-modal-google');
    if (btnGoogleModal) btnGoogleModal.addEventListener('click', () => this.loginWithProvider('google'));
  }

  open() {
    this.$overlay.classList.add('open');
  }

  openMode(mode = 'login') {
    // abrir modal en modo 'login' o 'register'
    this.mode = mode;
    this.$modeLabel.textContent = this.mode === 'login' ? 'Cuenta' : 'Registro';
    this.$title.textContent = this.mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta';
    this.$btnSwitch.textContent = this.mode === 'login' ? 'Cambiar a Registrar' : 'Cambiar a Iniciar sesión';
    this.$nombre.style.display = this.mode === 'login' ? 'none' : 'block';
    this.open();
  }

  /** Simula login con proveedor (Google). En producción usar OAuth. */
  async loginWithProvider(provider) {
    if (provider === 'google') {
      const promptEmail = prompt('Inicia sesión con Google - introduce tu email (simulado)');
      if (!promptEmail) {
        this.app.showToast('Inicio con Google cancelado', 'info');
        return;
      }
      const nombre = promptEmail.split('@')[0];
      try {
        const res = await fetch('api/google-auth.php', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: promptEmail, nombre })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const user = { id: data.user.id, nombre: data.user.nombre, email: promptEmail };
          localStorage.setItem('tm_user', JSON.stringify(user));
          this.app.setUser(user);
          // recargar tareas y categorías del usuario
          if (window.taskViewModel) await window.taskViewModel.cargarTodo();
          if (this.app && this.app.homeView) this.app.homeView.render();
          this.app.showToast('Conectado con Google', 'success');
          this.close();
          return;
        }
        this.app.showToast(data.message || data.error || 'Error Google', 'error');
      } catch (e) {
        console.error(e);
        this.app.showToast('Error de red Google', 'error');
      }
    } else {
      this.openMode('login');
    }
  }

  close() {
    this.$overlay.classList.remove('open');
  }

  _toggleMode() {
    this.mode = this.mode === 'login' ? 'register' : 'login';
    this.$modeLabel.textContent = this.mode === 'login' ? 'Cuenta' : 'Registro';
    this.$title.textContent = this.mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta';
    this.$btnSwitch.textContent = this.mode === 'login' ? 'Cambiar a Registrar' : 'Cambiar a Iniciar sesión';
    this.$nombre.style.display = this.mode === 'login' ? 'none' : 'block';
  }

  async _submit() {
    const nombre = this.$nombre.value.trim();
    const email = this.$email.value.trim();
    const password = this.$password.value;
    if (!email || !password || (this.mode === 'register' && !nombre)) {
      this.app.showToast('Completa los campos', 'error');
      return;
    }

    const payload = { nombre, email, password };
    const url = this.mode === 'login' ? 'api/login.php' : 'api/registro.php';
    try {
      const res = await fetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        // Guardar usuario localmente
        const user = { id: data.user_id || (data.user && data.user.id) || null, nombre: nombre || (data.user && data.user.nombre) || email, email };
        localStorage.setItem('tm_user', JSON.stringify(user));
        this.app.setUser(user);
        if (window.taskViewModel) await window.taskViewModel.cargarTodo();
        if (this.app && this.app.homeView) this.app.homeView.render();
        this.app.showToast(this.mode === 'login' ? 'Bienvenido' : 'Cuenta creada', 'success');
        this.close();
      } else {
        this.app.showToast(data.error || data.message || 'Error', 'error');
      }
    } catch (e) {
      console.error(e);
      this.app.showToast('Error de red', 'error');
    }
  }

  _restoreUser() {
    const u = localStorage.getItem('tm_user');
    if (u) {
      try { const user = JSON.parse(u); this.app.setUser(user); } catch(e){}
    }
  }

  /** Cierra sesión local (login opcional: la app sigue funcionando como invitado) */
  logout() {
    localStorage.removeItem('tm_user');
    this.app.setUser(null);
    if (window.taskViewModel) window.taskViewModel.cargarTodo();
    this.app.showToast('Sesión cerrada', 'info');
  }
}

// export not necessary; App will instantiate AuthView
