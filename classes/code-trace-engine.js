/**
 * CodeTraceEngine
 * Manages step-by-step code execution with line highlighting
 * synchronized to visualizer actions.
 */
class CodeTraceEngine {
  /**
   * @param {HTMLElement} codePanelEl - The <pre> element for code display
   * @param {AnimationController} anim - Animation controller for timing
   */
  constructor(codePanelEl, anim) {
    this.codePanelEl = codePanelEl;
    this.anim = anim;
    this.codeLines = [];
    this.steps = [];
    this.currentStep = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.manualMode = false;
    this._pauseResolve = null;
    this.onStepChange = null; // callback(stepIndex, totalSteps)
    this.onComplete = null;   // callback()
  }

  /**
   * Load code lines and trace steps for an operation.
   * @param {string[]} codeLines - Array of code line strings
   * @param {TraceStep[]} steps - Array of step objects:
   *   { line: number|number[], description: string, action: async () => void }
   *   line: 1-indexed line number(s) to highlight
   *   description: status message for this step
   *   action: async function performing the visual change
   */
  loadSteps(codeLines, steps) {
    this.codeLines = codeLines;
    this.steps = steps;
    this.currentStep = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.renderCode();
  }

  /**
   * Render the code into the panel with line numbers.
   * Each line is wrapped in a <div> with a data-line attribute for highlighting.
   */
  renderCode() {
    if (!this.codePanelEl) return;

    const container = document.createElement('div');
    container.className = 'code-trace-container';

    this.codeLines.forEach((line, i) => {
      const lineEl = document.createElement('div');
      lineEl.className = 'code-trace-line';
      lineEl.dataset.line = i + 1;

      const numEl = document.createElement('span');
      numEl.className = 'code-trace-line-num';
      numEl.textContent = String(i + 1).padStart(2, ' ');

      const textEl = document.createElement('span');
      textEl.className = 'code-trace-line-text';
      textEl.textContent = line;

      lineEl.appendChild(numEl);
      lineEl.appendChild(textEl);
      container.appendChild(lineEl);
    });

    this.codePanelEl.innerHTML = '';
    this.codePanelEl.appendChild(container);
  }

  /**
   * Highlight specific line(s) and mark as active.
   * @param {number|number[]} lineNumbers - 1-indexed line number(s)
   */
  highlightLine(lineNumbers) {
    if (!this.codePanelEl) return;

    const lines = Array.isArray(lineNumbers) ? lineNumbers : [lineNumbers];

    // Clear previous active highlights
    this.codePanelEl.querySelectorAll('.code-trace-line.active').forEach(el => {
      el.classList.remove('active');
    });

    // Highlight and scroll to the target line(s)
    lines.forEach(num => {
      const lineEl = this.codePanelEl.querySelector(`.code-trace-line[data-line="${num}"]`);
      if (lineEl) {
        lineEl.classList.add('active');
        lineEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  /**
   * Mark line(s) as executed (completed).
   * @param {number|number[]} lineNumbers - 1-indexed line number(s)
   */
  markExecuted(lineNumbers) {
    if (!this.codePanelEl) return;
    const lines = Array.isArray(lineNumbers) ? lineNumbers : [lineNumbers];
    lines.forEach(num => {
      const lineEl = this.codePanelEl.querySelector(`.code-trace-line[data-line="${num}"]`);
      if (lineEl) lineEl.classList.add('executed');
    });
  }

  /**
   * Clear all line highlights.
   */
  clearHighlights() {
    if (!this.codePanelEl) return;
    this.codePanelEl.querySelectorAll('.code-trace-line').forEach(el => {
      el.classList.remove('active', 'executed');
    });
  }

  /**
   * Execute all steps sequentially (auto-play mode).
   */
  async execute() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = this.manualMode;
    this.currentStep = 0;
    this.clearHighlights();

    try {
      while (this.currentStep < this.steps.length) {
        if (this.anim._abort) break;

        // Check for pause
        if (this.isPaused) {
          await new Promise(resolve => { this._pauseResolve = resolve; });
          if (this.currentStep >= this.steps.length) break;
        }

        if (this.anim._abort) break;

        const step = this.steps[this.currentStep];

        // Highlight the line(s)
        this.highlightLine(step.line);

        // Notify step change
        if (this.onStepChange) {
          this.onStepChange(this.currentStep, this.steps.length);
        }

        // Execute the visual action
        if (step.action) {
          await step.action();
        }

        // Wait for animation delay
        await this.anim.wait();

        if (this.anim._abort) break;

        // Mark line(s) as executed
        this.markExecuted(step.line);

        this.currentStep++;
      }
    } finally {
      this.isRunning = false;
      this.isPaused = false;

      if (this.onComplete) this.onComplete();
    }
  }

  /**
   * Execute a single step (manual stepping mode).
   * @returns {boolean} true if there are more steps
   */
  async stepForward() {
    if (this.currentStep >= this.steps.length) return false;

    const step = this.steps[this.currentStep];

    // Highlight the line(s)
    this.highlightLine(step.line);

    // Notify step change
    if (this.onStepChange) {
      this.onStepChange(this.currentStep, this.steps.length);
    }

    // Execute the visual action
    if (step.action) {
      await step.action();
    }

    // Mark line(s) as executed
    this.markExecuted(step.line);

    this.currentStep++;
    return this.currentStep < this.steps.length;
  }

  /**
   * Pause auto-play execution.
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume auto-play execution after pause.
   */
  resume() {
    this.isPaused = false;
    if (this._pauseResolve) {
      this._pauseResolve();
      this._pauseResolve = null;
    }
  }

  /**
   * Reset the trace engine state.
   */
  reset() {
    this.anim.abort();
    this.isRunning = false;
    this.isPaused = false;
    this.currentStep = 0;
    this.steps = [];
    this.codeLines = [];
    if (this._pauseResolve) {
      this._pauseResolve();
      this._pauseResolve = null;
    }
  }

  /**
   * Check if there are remaining steps.
   */
  get hasMoreSteps() {
    return this.currentStep < this.steps.length;
  }

  /**
   * Check if currently on the last step.
   */
  get isLastStep() {
    return this.currentStep >= this.steps.length - 1;
  }
}
