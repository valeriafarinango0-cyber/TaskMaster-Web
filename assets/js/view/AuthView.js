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
<<<<<<< HEAD
=======
    this.$rowNombre = document.getElementById('row-nombre');
    this.$rowPassword = document.getElementById('row-password');
    this.$rowSocialLogin = document.getElementById('row-social-login');
    this.$googleNote = document.getElementById('auth-google-note');
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50

    this.mode = 'login'; // or 'register'

    this._bind();
<<<<<<< HEAD
  }

  _bind() {
=======
    this._restoreUser();
  }

  _bind() {
    // Triggered from App: open(mode) will be used. Keep bind for safety.
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
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
<<<<<<< HEAD
=======
    // abrir modal en modo 'login' o 'register'
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
    this.mode = mode;
    this.$modeLabel.textContent = this.mode === 'login' ? 'Cuenta' : 'Registro';
    this.$title.textContent = this.mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta';
    this.$btnSwitch.textContent = this.mode === 'login' ? 'Cambiar a Registrar' : 'Cambiar a Iniciar sesión';
    this.$nombre.style.display = this.mode === 'login' ? 'none' : 'block';
<<<<<<< HEAD
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
=======
    this.$rowNombre.style.display = '';
    this.$rowPassword.style.display = '';
    this.$rowSocialLogin.style.display = '';
    this.$btnSwitch.style.display = '';
    this.$googleNote.style.display = 'none';
    this.$password.required = true;
    this.$submit.textContent = 'Continuar';
    this.open();
  }

  /** Simula login con proveedor (Google). En producción usar OAuth real. */
  openGoogleMode() {
    this.mode = 'google';
    this.$modeLabel.textContent = 'Google';
    this.$title.textContent = 'Continuar con Google';
    this.$rowNombre.style.display = 'none';
    this.$rowPassword.style.display = 'none';
    this.$rowSocialLogin.style.display = 'none';
    this.$btnSwitch.style.display = 'none';
    this.$googleNote.style.display = 'flex';
    this.$password.required = false;
    this.$submit.textContent = 'Continuar con Google';
    this.open();
  }

  async loginWithProvider(provider) {
    if (provider === 'google') {
      this.openGoogleMode();
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
    } else {
      this.openMode('login');
    }
  }

<<<<<<< HEAD
=======
  async _submitGoogle() {
    const email = this.$email.value.trim();
    if (!email) {
      this.app.showToast('Introduce tu correo', 'error');
      return;
    }
    const nombre = email.split('@')[0];
    try {
      const res = await fetch('api/auth?action=google', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nombre })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const user = { id: data.user.id, nombre: data.user.nombre, email };
        localStorage.setItem('tm_user', JSON.stringify(user));
        this.app.setUser(user);
        if (typeof taskViewModel !== 'undefined') await taskViewModel.cargarTareas();
        if (this.app && this.app.homeView) this.app.homeView.render();
        this.app.showToast('Conectado con Google', 'success');
        this.close();
        return;
      }
      this.app.showToast(data.error || 'Error Google', 'error');
    } catch (e) {
      console.error(e);
      this.app.showToast('Error de red Google', 'error');
    }
  }

>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
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
<<<<<<< HEAD
=======
    if (this.mode === 'google') {
      return this._submitGoogle();
    }
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
    const nombre = this.$nombre.value.trim();
    const email = this.$email.value.trim();
    const password = this.$password.value;
    if (!email || !password || (this.mode === 'register' && !nombre)) {
      this.app.showToast('Completa los campos', 'error');
      return;
    }

    const payload = { nombre, email, password };
<<<<<<< HEAD
    const url = this.mode === 'login' ? 'api/login.php' : 'api/registro.php';
=======
    const url = this.mode === 'login' ? 'api/auth?action=login' : 'api/auth?action=register';
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
    try {
      const res = await fetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
<<<<<<< HEAD
        const user = { id: data.user_id || (data.user && data.user.id) || null, nombre: nombre || (data.user && data.user.nombre) || email, email };
        localStorage.setItem('tm_user', JSON.stringify(user));
        await this._onAuthSuccess(user, this.mode === 'login' ? 'Bienvenido' : 'Cuenta creada');
      } else {
        this.app.showToast(data.error || data.message || 'Error', 'error');
=======
        // Guardar usuario localmente
        const user = { id: data.user_id || (data.user && data.user.id) || null, nombre: nombre || (data.user && data.user.nombre) || email, email };
        localStorage.setItem('tm_user', JSON.stringify(user));
        this.app.setUser(user);
        if (typeof taskViewModel !== 'undefined') await taskViewModel.cargarTareas();
        if (this.app && this.app.homeView) this.app.homeView.render();
        this.app.showToast(this.mode === 'login' ? 'Bienvenido' : 'Cuenta creada', 'success');
        this.close();
      } else {
        this.app.showToast(data.error || 'Error', 'error');
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
      }
    } catch (e) {
      console.error(e);
      this.app.showToast('Error de red', 'error');
    }
  }

<<<<<<< HEAD
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
=======
  _restoreUser() {
    const u = localStorage.getItem('tm_user');
    let user = null;
    if (u) {
      try { user = JSON.parse(u); } catch (e) { user = null; }
    }
    // Siempre se llama, incluso sin sesión guardada, para que el gating de
    // sesión (mostrar/ocultar el flujo de trabajo) se aplique desde el arranque.
    this.app.setUser(user);
  }

  async logout() {
    localStorage.removeItem('tm_user');
    this.app.setUser(null);
    // Recargar tareas sin usuario para no seguir mostrando las de la sesión cerrada
    if (typeof taskViewModel !== 'undefined') await taskViewModel.cargarTareas();
    if (this.app && this.app.homeView) this.app.homeView.render();
>>>>>>> 3172dd1abb413cac36de18701f41dcc462326b50
    this.app.showToast('Sesión cerrada', 'info');
  }
}

// export not necessary; App will instantiate AuthView
