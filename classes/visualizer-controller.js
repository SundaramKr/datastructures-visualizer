/**
 * VisualizerController
 * Shared wiring for data-structure visualizers (arrays & linked lists).
 * Used by both the Data Structures section and the Teacher Dashboard.
 */
class VisualizerController {
  /**
   * @param {Object} config
   * @param {HTMLElement} config.container
   * @param {HTMLElement} config.statusEl
   * @param {HTMLElement} config.codePanelEl
   * @param {HTMLElement} config.screenRoot - parent screen element (for speed button scoping)
   * @param {Object} config.buttons
   * @param {Function} config.getLanguage - () => 'c' | 'python'
   * @param {Function} config.promptOperation - (title, desc, defaultVal, callback) => void
   * @param {Function} config.onNodeClick - (index, type) => void
   */
  constructor(config) {
    this.config = config;
    this.anim = new AnimationController();
    this.visualizer = null;
    this.codeTraceEngine = null;
    this.module = null;
    this.initialValues = [];
    this.initialCapacity = 5;
    this.isManualMode = false;
    this.currentOperation = null;

    this._bindControls();
  }

  isLinkedListMode() {
    return this.module === 'linkedlist' && this.visualizer instanceof LinkedListVisualizer;
  }

  _shouldUseTrace() {
    return this.isLinkedListMode() && this.codeTraceEngine;
  }

  launch(module, values, capacity) {
    this.module = module;
    this.initialValues = Array.isArray(values) ? [...values] : values;
    if (capacity !== undefined) this.initialCapacity = capacity;

    const { container, statusEl, codePanelEl, buttons } = this.config;

    if (module === 'array') {
      this.visualizer = new ArrayVisualizer(container, this.anim, statusEl);
      this.visualizer.onCellClick = (index) => this.config.onNodeClick(index, 'array');
      this.visualizer.init(values, capacity);
      this.updateCodePanel('create', null, null, null, values, capacity);
      if (buttons.reverse) buttons.reverse.hidden = true;
    } else {
      this.visualizer = new LinkedListVisualizer(container, this.anim, statusEl);
      this.visualizer.onNodeClick = (index) => this.config.onNodeClick(index, 'linkedlist');
      this.visualizer.init(values);
      this.updateCodePanel('create', null, null, null, values, null);
      if (buttons.reverse) buttons.reverse.hidden = false;
    }

    if (this.codeTraceEngine) {
      this.codeTraceEngine.reset();
    }
    if (codePanelEl) {
      this.codeTraceEngine = new CodeTraceEngine(codePanelEl, this.anim);
      this.codeTraceEngine.manualMode = this.isManualMode;
    }
  }

  updateCodePanel(operation, value = null, index = null, position = null, values = null, capacity = null) {
    if (!this.module) return;

    this.currentOperation = { operation, value, index, position, values, capacity };

    const lang = this.config.getLanguage();
    const templates = lang === 'python'
      ? PythonCodeTemplates[this.module]
      : CCodeTemplates[this.module];
    if (!templates || !templates[operation]) return;

    let code;
    if (operation === 'create') {
      code = templates.create(values, capacity);
    } else if (operation === 'insert') {
      code = templates.insert(index, value, position);
    } else if (operation === 'delete') {
      code = templates.delete(index);
    } else if (operation === 'update') {
      code = templates.update(index, value);
    } else if (operation === 'search') {
      code = templates.search(value);
    } else if (operation === 'traverse') {
      code = templates.traverse();
    } else if (operation === 'highlight') {
      code = templates.highlight(index);
    }

    if (code && this.config.codePanelEl) {
      this.config.codePanelEl.textContent = code;
    }
  }

  refreshCodePanel() {
    if (!this.currentOperation) {
      this.resetCodePanelText();
      return;
    }
    const { operation, value, index, position, values, capacity } = this.currentOperation;
    this.updateCodePanel(operation, value, index, position, values, capacity);
  }

  resetCodePanelText() {
    const lang = this.config.getLanguage();
    const defaultText = `// Click on an operation to see the ${lang === 'python' ? 'Python' : 'C'} code`;
    if (this.config.codePanelEl) {
      this.config.codePanelEl.textContent = defaultText;
    }
  }

  handleContextAction(action, index) {
    const viz = this.visualizer;
    if (!viz) return;

    const useTrace = this._shouldUseTrace();

    switch (action) {
      case 'insert-before':
        this.config.promptOperation('Insert Before', 'Value to insert?', '99', (val) => {
          if (useTrace) {
            viz.guard(() => viz.insertAtTraced(index, val, 'before', this.codeTraceEngine, this.config.getLanguage()));
          } else {
            this.updateCodePanel('insert', val, index, 'before');
            viz.guard(() => viz.insertAt(index, val, 'before'));
          }
        });
        break;
      case 'insert-after':
        this.config.promptOperation('Insert After', 'Value to insert?', '99', (val) => {
          if (useTrace) {
            viz.guard(() => viz.insertAtTraced(index, val, 'after', this.codeTraceEngine, this.config.getLanguage()));
          } else {
            this.updateCodePanel('insert', val, index, 'after');
            viz.guard(() => viz.insertAt(index, val, 'after'));
          }
        });
        break;
      case 'delete':
        if (useTrace) {
          viz.guard(() => viz.deleteAtTraced(index, this.codeTraceEngine, this.config.getLanguage()));
        } else {
          this.updateCodePanel('delete', null, index);
          viz.guard(() => viz.deleteAt(index));
        }
        break;
      case 'update': {
        const current = this.module === 'array'
          ? viz.data[index]
          : viz.nodes[index].value;
        this.config.promptOperation('Update Value', 'New value?', String(current), (val) => {
          if (useTrace) {
            viz.guard(() => viz.updateAtTraced(index, val, this.codeTraceEngine, this.config.getLanguage()));
          } else {
            this.updateCodePanel('update', val, index);
            viz.guard(() => viz.updateAt(index, val));
          }
        });
        break;
      }
      case 'highlight':
        this.updateCodePanel('highlight', null, index);
        viz.highlightAt(index);
        break;
    }
  }

  _bindControls() {
    const { buttons, screenRoot } = this.config;

    if (screenRoot) {
      screenRoot.querySelectorAll('.btn-speed').forEach((btn) => {
        btn.addEventListener('click', () => {
          screenRoot.querySelectorAll('.btn-speed').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.anim.setSpeed(btn.dataset.speed);
        });
      });
    }

    if (buttons.traverse) {
      buttons.traverse.addEventListener('click', () => {
        if (!this.visualizer) return;
        if (this._shouldUseTrace()) {
          this.visualizer.guard(() => this.visualizer.traverseTraced(this.codeTraceEngine, this.config.getLanguage()));
        } else {
          this.updateCodePanel('traverse');
          this.visualizer.guard(() => this.visualizer.traverse());
        }
      });
    }

    if (buttons.search) {
      buttons.search.addEventListener('click', () => {
        if (!this.visualizer) return;
        const structureName = this.module === 'array' ? 'array' : 'linked list';
        this.config.promptOperation(
          'Search',
          `Find value in ${structureName}`,
          this.visualizer.searchDefault,
          (val) => {
            if (this._shouldUseTrace()) {
              this.visualizer.guard(() => this.visualizer.searchTraced(val, this.codeTraceEngine, this.config.getLanguage()));
            } else {
              this.updateCodePanel('search', val);
              this.visualizer.guard(() => this.visualizer.search(val));
            }
          }
        );
      });
    }

    if (buttons.reverse) {
      buttons.reverse.addEventListener('click', () => {
        if (!this.visualizer || !this._shouldUseTrace()) return;
        this.visualizer.guard(() => this.visualizer.reverseTraced(this.codeTraceEngine, this.config.getLanguage()));
      });
    }

    if (buttons.reset) {
      buttons.reset.addEventListener('click', () => {
        if (!this.visualizer) return;
        if (this.codeTraceEngine) this.codeTraceEngine.reset();
        this.visualizer.reset([...this.initialValues], this.initialCapacity);
        this.resetCodePanelText();
      });
    }

    if (buttons.stepForward) {
      buttons.stepForward.addEventListener('click', () => {
        if (!this.codeTraceEngine || !this.codeTraceEngine.hasMoreSteps) return;
        this.codeTraceEngine.stepForward();
      });
    }

    if (buttons.toggleMode) {
      buttons.toggleMode.addEventListener('click', () => {
        this.isManualMode = !this.isManualMode;
        buttons.toggleMode.textContent = `Mode: ${this.isManualMode ? 'Manual' : 'Auto'}`;
        if (buttons.stepForward) {
          buttons.stepForward.style.display = this.isManualMode ? 'inline-block' : 'none';
        }
        if (this.codeTraceEngine) {
          this.codeTraceEngine.manualMode = this.isManualMode;
          if (!this.isManualMode && this.codeTraceEngine.isPaused) {
            this.codeTraceEngine.resume();
          } else if (this.isManualMode && this.codeTraceEngine.isRunning && !this.codeTraceEngine.isPaused) {
            this.codeTraceEngine.pause();
          }
        }
      });
    }

    if (buttons.abort) {
      buttons.abort.addEventListener('click', () => {
        if (!this.visualizer || !this.visualizer.busy) return;
        this.visualizer.anim.abort();
        if (this.codeTraceEngine) {
          this.codeTraceEngine.resume();
          this.codeTraceEngine.clearHighlights();
        }
        if (this.isLinkedListMode()) {
          this.visualizer._clearPointerLabels();
          this.visualizer._clearDecision();
          this.visualizer._clearFloatingNode();
          this.visualizer.clearHighlights();
          this.visualizer.render();
        }
      });
    }
  }
}
