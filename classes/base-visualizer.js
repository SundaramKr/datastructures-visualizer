class BaseVisualizer {
  constructor(container, anim, statusEl, infoStrip) {
    this.container = container;
    this.anim = anim;
    this.statusEl = statusEl;
    this.infoStrip = infoStrip;
    this.busy = false;
  }

  setStatus(msg) {
    this.statusEl.textContent = msg;
  }

  setInfo(items) {
    this.infoStrip.innerHTML = items
      .map(({ label, value, highlight }) =>
        `<span class="info-badge${highlight ? ' highlight-info' : ''}">${label}: ${value}</span>`
      )
      .join('');
  }

  clearInfo() {
    this.infoStrip.innerHTML = '';
  }

  async guard(fn) {
    if (this.busy) return;
    this.busy = true;
    this.anim.resetAbort();
    try {
      await fn();
    } finally {
      this.busy = false;
    }
  }
}
