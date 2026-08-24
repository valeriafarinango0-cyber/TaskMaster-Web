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
    this._gateMode = false; // true mientras no hay sesión: el modal no se puede cerrar

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

  /**
   * Login obligatorio: bloquea el panel por completo (fondo sólido, sin botón
   * de cerrar, sin cerrar con click afuera ni Escape) hasta iniciar sesión.
   */
  abrirGate() {
    this._gateMode = true;
    this.$overlay.classList.add('modal-overlay--gate');
    this.$btnClose.style.display = 'none';
    this.openMode('login');
  }

  _salirDeGate() {
    this._gateMode = false;
    this.$overlay.classList.remove('modal-overlay--gate');
    this.$btnClose.style.display = '';
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
    if (this._gateMode) return; // no se puede cerrar sin iniciar sesión
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
        const user = { id: data.user_id || (data.user && data.user.id) || null, nombre: nombre || (data.user && data.user.nombre) || email, email };
        localStorage.setItem('tm_user', JSON.stringify(user));
        await this._onAuthSuccess(user, this.mode === 'login' ? 'Bienvenido' : 'Cuenta creada');
      } else {
        this.app.showToast(data.error || data.message || 'Error', 'error');
      }
    } catch (e) {
      console.error(e);
      this.app.showToast('Error de red', 'error');
    }
  }

  /** Ruta común tras un login/registro/Google exitoso, venga de gate o del modal normal. */
  async _onAuthSuccess(user, mensaje) {
    const veniaDeGate = this._gateMode;
    if (veniaDeGate) this._salirDeGate();
    this.app.setUser(user);
    this.$form.reset();
    this.close();
    this.app.showToast(mensaje, 'success');
    if (veniaDeGate) {
      await this.app.onAuthenticated();
    } else if (window.taskViewModel) {
      await window.taskViewModel.cargarTodo();
      if (this.app.homeView) this.app.homeView.render();
    }
  }

  _restoreUser() {
    const u = localStorage.getItem('tm_user');
    if (u) {
      try { const user = JSON.parse(u); this.app.setUser(user); return true; } catch (e) { return false; }
    }
    return false;
  }

  /** Cierra sesión: vuelve a exigir login (el panel se bloquea de nuevo). */
  logout() {
    localStorage.removeItem('tm_user');
    this.app.setUser(null);
    this.abrirGate();
  }
}

// export not necessary; App will instantiate AuthView
