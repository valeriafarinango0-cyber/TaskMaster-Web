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
  }

  _bind() {
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
          await this._onAuthSuccess(user, 'Conectado con Google');
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
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        this.app.showToast('El servidor no respondió correctamente. Verifica que esté corriendo.', 'error');
        return;
      }
      if (data.success) {
        const user = { id: data.user_id || (data.user && data.user.id) || null, nombre: nombre || (data.user && data.user.nombre) || email, email };
        localStorage.setItem('tm_user', JSON.stringify(user));
        await this._onAuthSuccess(user, this.mode === 'login' ? 'Bienvenido' : 'Cuenta creada');
      } else if (res.status === 401) {
        this.app.showToast(this.mode === 'login' ? 'Correo o contraseña incorrectos' : (data.error || 'Error'), 'error');
      } else {
        this.app.showToast(data.error || data.message || 'Error', 'error');
      }
    } catch (e) {
      console.error(e);
      this.app.showToast('No se pudo conectar con el servidor. Verifica tu conexión.', 'error');
    }
  }

  /** Ruta común tras un login/registro/Google exitoso. */
  async _onAuthSuccess(user, mensaje) {
    this.app.setUser(user);
    this.$form.reset();
    this.close();
    this.app.showToast(mensaje, 'success');
    await this.app.onAuthenticated();
  }

  _restoreUser() {
    const u = localStorage.getItem('tm_user');
    if (u) {
      try { const user = JSON.parse(u); this.app.setUser(user); return true; } catch (e) { return false; }
    }
    return false;
  }

  /** Cierra sesión: vuelve a la landing pública en modo invitado. */
  logout() {
    localStorage.removeItem('tm_user');
    this.app.setUser(null);
    this.app.mostrarModoInvitado();
    this.app.showToast('Sesión cerrada', 'info');
  }
}

// export not necessary; App will instantiate AuthView
