class BaseVisualizer {
  constructor(container, anim, statusEl) {
    this.container = container;
    this.anim = anim;
    this.statusEl = statusEl;
    this.busy = false;
  }

  setStatus(msg) {
    this.statusEl.textContent = msg;
  }

  async guard(fn) {
    if (this.busy) return;
    this.busy = true;
    document.body.classList.add('is-animating');
    this.anim.resetAbort();
    try {
      await fn();
    } finally {
      this.busy = false;
      document.body.classList.remove('is-animating');
    }
  }
}
