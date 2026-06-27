/**
 * BMSCE email login for the whiteboard app.
 */

const ALLOWED_DOMAIN = '@bmsce.ac.in';
const STORAGE_KEY = 'whiteboardUser';

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function isAllowedEmail(email) {
  const normalized = normalizeEmail(email);
  return (
    normalized.endsWith(ALLOWED_DOMAIN) &&
    normalized.length > ALLOWED_DOMAIN.length &&
    !normalized.includes(' ')
  );
}

class Auth {
  static isLoggedIn() {
    return Boolean(localStorage.getItem(STORAGE_KEY));
  }

  static getUser() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static setUser(user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  static logout() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  static async login(email, password) {
    const response = await fetch(window.AUTH_CONFIG.loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizeEmail(email),
        password,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Login failed');
    }
    return data;
  }

  static async signup(email, name, password) {
    const response = await fetch(window.AUTH_CONFIG.signupUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizeEmail(email),
        name: name.trim(),
        password,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Signup failed');
    }
    return data;
  }
}

class AuthUI {
  constructor() {
    this.screen = document.getElementById('screen-auth');
    this.form = document.getElementById('auth-form');
    this.emailInput = document.getElementById('auth-email');
    this.nameField = document.getElementById('auth-name-field');
    this.nameInput = document.getElementById('auth-name');
    this.passwordInput = document.getElementById('auth-password');
    this.errorEl = document.getElementById('auth-error');
    this.submitBtn = document.getElementById('auth-submit');
    this.mode = 'login';

    document.querySelectorAll('[data-auth-mode]').forEach((btn) => {
      btn.addEventListener('click', () => this.setMode(btn.dataset.authMode));
    });

    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.screen.classList.add('active');
  }

  setMode(mode) {
    this.mode = mode;
    document.querySelectorAll('[data-auth-mode]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.authMode === mode);
    });
    this.nameField.hidden = mode !== 'signup';
    this.submitBtn.textContent = mode === 'signup' ? 'Create account' : 'Sign in';
    this.clearError();
  }

  clearError() {
    this.errorEl.hidden = true;
    this.errorEl.textContent = '';
  }

  showError(message) {
    this.errorEl.textContent = message;
    this.errorEl.hidden = false;
  }

  async handleSubmit(e) {
    e.preventDefault();
    this.clearError();

    const email = this.emailInput.value;
    const password = this.passwordInput.value;
    const name = this.nameInput.value;

    if (!email.trim() || !password.trim()) {
      this.showError('Please fill in all fields.');
      return;
    }

    if (!isAllowedEmail(email)) {
      this.showError('Only @bmsce.ac.in email addresses are allowed.');
      return;
    }

    if (this.mode === 'signup' && password.length < 6) {
      this.showError('Password must be at least 6 characters.');
      return;
    }

    if (this.mode === 'signup' && !name.trim()) {
      this.showError('Please enter your name.');
      return;
    }

    if (window.AUTH_CONFIG.projectRef === 'YOUR_PROJECT_REF') {
      this.showError('Set your Supabase project ref in backend/auth/config.js first.');
      return;
    }

    this.submitBtn.disabled = true;
    const originalLabel = this.submitBtn.textContent;
    this.submitBtn.textContent = 'Please wait…';

    try {
      let data;
      if (this.mode === 'signup') {
        data = await Auth.signup(email, name, password);
      } else {
        data = await Auth.login(email, password);
      }

      Auth.setUser({
        email: data.email,
        name: data.name || name.trim() || null,
      });

      this.screen.classList.remove('active');
      window.app = new App();
      window.app.showScreen('home');
      window.app.updateUserBar();
    } catch (err) {
      this.showError(err.message || 'Something went wrong. Try again.');
    } finally {
      this.submitBtn.disabled = false;
      this.submitBtn.textContent = originalLabel;
    }
  }
}

function bootstrapApp() {
  if (Auth.isLoggedIn()) {
    window.app = new App();
    window.app.showScreen('home');
    window.app.updateUserBar();
  } else {
    new AuthUI();
  }
}

document.addEventListener('DOMContentLoaded', bootstrapApp);
