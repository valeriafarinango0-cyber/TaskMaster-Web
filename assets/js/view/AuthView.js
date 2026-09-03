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
    this.$emailRow = document.getElementById('auth-email-row');
    this.$passwordRow = document.getElementById('auth-password-row');
    this.$passwordLabel = document.getElementById('auth-password-label');
    this.$passwordConfirmRow = document.getElementById('auth-password-confirm-row');
    this.$passwordConfirm = document.getElementById('auth-password-confirm');
    this.$forgotRow = document.getElementById('auth-forgot-row');
    this.$btnForgot = document.getElementById('btn-forgot-password');

    this.mode = 'login'; // 'login' | 'register' | 'forgot' | 'reset'
    this._resetToken = null;

    // Client ID de Google Cloud Console (no es secreto, viaja en el frontend).
    this.GOOGLE_CLIENT_ID = '1047323212016-hanf3ml2lg14ltd61j7naso03p3o53qj.apps.googleusercontent.com';
    this._googleInitialized = false;

    this._bind();
  }

  _bind() {
    this.$btnClose.addEventListener('click', () => this.close());
    this.$overlay.addEventListener('click', e => { if (e.target === this.$overlay) this.close(); });
    this.$btnSwitch.addEventListener('click', () => this._toggleMode());
    this.$form.addEventListener('submit', e => { e.preventDefault(); this._submit(); });
    const btnGoogleModal = document.getElementById('btn-modal-google');
    if (btnGoogleModal) btnGoogleModal.addEventListener('click', () => this.loginWithProvider('google'));
    if (this.$btnForgot) this.$btnForgot.addEventListener('click', () => this._setMode('forgot'));
  }

  open() {
    this.$overlay.classList.add('open');
  }

  openMode(mode = 'login') {
    this._setMode(mode);
    this.open();
  }

  /** Abre el modal directamente en modo "nueva contraseña" con el token del enlace del correo. */
  openReset(token) {
    this._resetToken = token;
    this._setMode('reset');
    this.open();
  }

  _setMode(mode) {
    this.mode = mode;
    const labels = {
      login:    { modeLabel: 'Cuenta',   title: 'Iniciar sesión',        submit: 'Continuar' },
      register: { modeLabel: 'Registro', title: 'Crear cuenta',          submit: 'Continuar' },
      forgot:   { modeLabel: 'Cuenta',   title: 'Recuperar contraseña',  submit: 'Enviar enlace' },
      reset:    { modeLabel: 'Cuenta',   title: 'Nueva contraseña',      submit: 'Guardar contraseña' },
    }[mode];

    this.$modeLabel.textContent = labels.modeLabel;
    this.$title.textContent = labels.title;
    this.$submit.textContent = labels.submit;

    this.$nombre.style.display = mode === 'register' ? 'block' : 'none';
    this.$emailRow.style.display = mode === 'reset' ? 'none' : 'block';
    this.$passwordRow.style.display = mode === 'forgot' ? 'none' : 'block';
    this.$passwordConfirmRow.style.display = mode === 'reset' ? 'block' : 'none';
    this.$passwordLabel.textContent = mode === 'reset' ? 'Nueva contraseña' : 'Contraseña';
    this.$forgotRow.style.display = mode === 'login' ? 'block' : 'none';

    const showSwitch = mode === 'login' || mode === 'register';
    this.$btnSwitch.style.display = showSwitch ? 'inline-block' : 'none';
    this.$btnSwitch.textContent = mode === 'login' ? 'Cambiar a Registrar' : 'Cambiar a Iniciar sesión';
  }

  /** Login real con Google Identity Services (One Tap / botón). */
  async loginWithProvider(provider) {
    if (provider !== 'google') {
      this.openMode('login');
      return;
    }
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
      this.app.showToast('No se pudo cargar el inicio de sesión de Google. Revisa tu conexión e intenta de nuevo.', 'error');
      return;
    }

    if (!this._googleInitialized) {
      google.accounts.id.initialize({
        client_id: this.GOOGLE_CLIENT_ID,
        callback: (response) => this._handleGoogleCredential(response),
      });
      this._googleInitialized = true;
    }

    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed && notification.isNotDisplayed()) {
        this.app.showToast('Google no mostró el diálogo de inicio de sesión (revisa cookies de terceros).', 'error');
      } else if (notification.isSkippedMoment && notification.isSkippedMoment()) {
        this.app.showToast('Inicio con Google cancelado', 'info');
      }
    });
  }

  /** Callback de Google Identity Services: llega con un ID token firmado. */
  async _handleGoogleCredential(response) {
    try {
      const res = await fetch('api/google-auth.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const user = { id: data.user.id, nombre: data.user.nombre, email: data.user.email };
        localStorage.setItem('tm_user', JSON.stringify(user));
        await this._onAuthSuccess(user, 'Conectado con Google');
        return;
      }
      this.app.showToast(data.message || data.error || 'Error de autenticación con Google', 'error');
    } catch (e) {
      console.error(e);
      this.app.showToast('Error de red al conectar con Google', 'error');
    }
  }

  close() {
    this.$overlay.classList.remove('open');
  }

  _toggleMode() {
    this._setMode(this.mode === 'login' ? 'register' : 'login');
  }

  async _submit() {
    if (this.mode === 'forgot') return this._submitForgot();
    if (this.mode === 'reset') return this._submitReset();

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

  /** Modo 'forgot': pide el correo y solicita el enlace de recuperación. */
  async _submitForgot() {
    const email = this.$email.value.trim();
    if (!email) {
      this.app.showToast('Ingresa tu correo', 'error');
      return;
    }
    try {
      const res = await fetch('api/reset-password.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email })
      });
      const data = await res.json();
      this.app.showToast(data.message || 'Si el correo existe, te enviamos un enlace.', 'success');
      this._setMode('login');
    } catch (e) {
      console.error(e);
      this.app.showToast('No se pudo conectar con el servidor.', 'error');
    }
  }

  /** Modo 'reset': define la nueva contraseña usando el token del enlace del correo. */
  async _submitReset() {
    const password = this.$password.value;
    const confirm = this.$passwordConfirm.value;
    if (!password || password.length < 8) {
      this.app.showToast('La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }
    if (password !== confirm) {
      this.app.showToast('Las contraseñas no coinciden', 'error');
      return;
    }
    try {
      const res = await fetch('api/reset-password.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', token: this._resetToken, password })
      });
      const data = await res.json();
      if (data.success) {
        this.app.showToast(data.message || 'Contraseña actualizada', 'success');
        this._resetToken = null;
        this._setMode('login');
      } else {
        this.app.showToast(data.error || 'No se pudo actualizar la contraseña', 'error');
      }
    } catch (e) {
      console.error(e);
      this.app.showToast('No se pudo conectar con el servidor.', 'error');
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
