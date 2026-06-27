/**
 * Data Structures Visualizer
 * Main Application Controller
 */

class App {
  constructor() {
    this.anim = new AnimationController();
    this.currentModule = null;
    this.visualizer = null;
    this.contextTarget = null;
    this._operationCallback = null;
    this.currentLanguage = 'c';
    this.currentOperation = null;

    this.screens = {
      home: document.getElementById('screen-home'),
      modules: document.getElementById('screen-modules'),
      slides: document.getElementById('screen-slides'),
      visualizer: document.getElementById('screen-visualizer'),
    };

    this.elements = {
      vizTitle: document.getElementById('viz-title'),
      vizContainer: document.getElementById('viz-container'),
      statusMessage: document.getElementById('status-message'),
      infoStrip: document.getElementById('info-strip'),
      inputModal: document.getElementById('input-modal'),
      modalTitle: document.getElementById('modal-title'),
      modalDesc: document.getElementById('modal-desc'),
      modalLabel: document.getElementById('modal-label'),
      modalInput: document.getElementById('modal-input'),
      modalSizeField: document.getElementById('modal-size-field'),
      modalSize: document.getElementById('modal-size'),
      operationModal: document.getElementById('operation-modal'),
      operationTitle: document.getElementById('operation-title'),
      operationDesc: document.getElementById('operation-desc'),
      operationInput: document.getElementById('operation-input'),
      contextMenu: document.getElementById('context-menu'),
      overlay: document.getElementById('overlay'),
      btnTraverse: document.getElementById('btn-traverse'),
      btnSearch: document.getElementById('btn-search'),
      btnReset: document.getElementById('btn-reset'),
      codePanel: document.getElementById('code-panel'),
      codePanelContent: document.getElementById('code-panel-content'),
      codePanelClose: document.getElementById('code-panel-close'),
      codePanelTitle: document.getElementById('code-panel-title'),
      slidesTitle: document.getElementById('slides-title'),
      slideContent: document.getElementById('slide-content'),
      slideIndicator: document.getElementById('slide-indicator'),
      btnPrevSlide: document.getElementById('btn-prev-slide'),
      btnNextSlide: document.getElementById('btn-next-slide'),
      chaptersPanelContent: document.getElementById('chapters-panel-content'),
    };

    this.slideState = {
      currentModule: null,
      currentSlideIndex: 0,
      slides: [],
    };

    this.initialValues = [];
    this._bindEvents();
  }

  updateUserBar() {
    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    const bar = document.getElementById('user-bar');
    const greeting = document.getElementById('user-greeting');
    if (!bar || !greeting) return;
    if (user) {
      bar.hidden = false;
      greeting.textContent = user.name ? `Hi, ${user.name}` : user.email;
    } else {
      bar.hidden = true;
    }
  }

  _bindEvents() {
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => Auth.logout());
    }

    document.getElementById('btn-enter').addEventListener('click', () => this.showScreen('modules'));
    document.getElementById('btn-back-modules').addEventListener('click', () => this.showScreen('home'));
    document.getElementById('btn-back-slides').addEventListener('click', () => this.showScreen('modules'));
    document.getElementById('btn-back-viz').addEventListener('click', () => {
      this.anim.abort();
      this.hideContextMenu();
      this.showScreen('slides');
    });

    document.querySelectorAll('.card-module').forEach((card) => {
      card.addEventListener('click', () => this.selectModule(card.dataset.module));
    });

    document.getElementById('modal-cancel').addEventListener('click', () => {
      this.elements.inputModal.close();
      this.showScreen('modules');
    });

    document.getElementById('input-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const values = this._parseValues(this.elements.modalInput.value);
      let size = parseInt(this.elements.modalSize.value, 10);
      if (this.currentModule === 'array') {
        size = Number.isNaN(size) || size < 1 ? 5 : Math.min(Math.max(size, 1), 20);
        const arrayValues = this._buildArrayValues(values, size);
        this.initialValues = arrayValues;
        this.initialCapacity = size;
        this.elements.inputModal.close();
        this.launchVisualizer(arrayValues, size);
      } else {
        if (values.length === 0) return;
        this.initialValues = values;
        this.elements.inputModal.close();
        this.launchVisualizer(values);
      }
    });

    document.getElementById('operation-cancel').addEventListener('click', () => {
      this.elements.operationModal.close();
    });

    document.getElementById('operation-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleOperationConfirm();
    });

    this.elements.overlay.addEventListener('click', () => this.hideContextMenu());

    this.elements.contextMenu.querySelectorAll('.context-item').forEach((item) => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        const target = this.contextTarget;
        this.hideContextMenu();
        if (target) this._handleContextAction(action, target);
      });
    });

    document.querySelectorAll('.btn-speed').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-speed').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.anim.setSpeed(btn.dataset.speed);
      });
    });

    this.elements.btnTraverse.addEventListener('click', () => {
      if (this.visualizer) {
        this.updateCodePanel('traverse');
        this.visualizer.guard(() => this.visualizer.traverse());
      }
    });

    this.elements.btnSearch.addEventListener('click', () => {
      if (!this.visualizer) return;
      this._promptOperation(
        'Search',
        `Find value in ${this.currentModule === 'array' ? 'array' : 'linked list'}`,
        this.visualizer.searchDefault,
        (val) => {
          this.updateCodePanel('search', val);
          this.visualizer.guard(() => this.visualizer.search(val));
        }
      );
    });

    this.elements.btnReset.addEventListener('click', () => {
      if (this.visualizer) {
        this.visualizer.reset([...this.initialValues]);
        this.elements.codePanelContent.textContent = `// Click on an operation to see the ${this.currentLanguage === 'python' ? 'Python' : 'C'} code`;
      }
    });

    this.elements.codePanelClose.addEventListener('click', () => {
      this.elements.codePanelContent.textContent = `// Click on an operation to see the ${this.currentLanguage === 'python' ? 'Python' : 'C'} code`;
    });

    // Language switcher event listeners
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        this.currentLanguage = lang;
        
        // Update active state
        document.querySelectorAll('.lang-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Refresh code panel with current operation in new language
        if (this.currentOperation) {
          const { operation, value, index, position, values, capacity } = this.currentOperation;
          this.updateCodePanel(operation, value, index, position, values, capacity);
        } else if (this.visualizer && this.currentModule) {
          this.elements.codePanelContent.textContent = `// Click on an operation to see the ${lang === 'python' ? 'Python' : 'C'} code`;
        }
      });
    });

    this.elements.btnPrevSlide.addEventListener('click', () => this.navigateSlide(-1));
    this.elements.btnNextSlide.addEventListener('click', () => this.navigateSlide(1));
  }

  showScreen(name) {
    Object.values(this.screens).forEach((s) => s.classList.remove('active'));
    this.screens[name].classList.add('active');
  }

  updateCodePanel(operation, value = null, index = null, position = null, values = null, capacity = null) {
    if (!this.currentModule) return;

    // Store current operation parameters for language switching
    this.currentOperation = { operation, value, index, position, values, capacity };

    const templates = this.currentLanguage === 'python' 
      ? PythonCodeTemplates[this.currentModule]
      : CCodeTemplates[this.currentModule];
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

    if (code) {
      this.elements.codePanelContent.textContent = code;
    }
  }

  selectModule(module) {
    this.currentModule = module;
    this.loadSlides(module);
    this.showScreen('slides');
  }

  loadSlides(module) {
    this.slideState.currentModule = module;
    this.slideState.currentSlideIndex = 0;
    this.slideState.slides = SlidesContent[module] || [];

    const title = module === 'array' ? 'Array Lessons' : 'Linked List Lessons';
    this.elements.slidesTitle.textContent = title;

    this.renderSlide();
    this.populateChaptersPanel();
  }

  renderSlide() {
    const { slides, currentSlideIndex } = this.slideState;
    const slide = slides[currentSlideIndex];

    if (!slide) {
      this.elements.slideContent.innerHTML = '<p class="slide-text">No slides available.</p>';
      return;
    }

    this.elements.slideContent.innerHTML = `
      <h2 class="slide-title">${slide.title}</h2>
      ${slide.content}
    `;

    this.elements.slideIndicator.textContent = `${currentSlideIndex + 1} / ${slides.length}`;

    this.elements.btnPrevSlide.disabled = currentSlideIndex === 0;
    this.elements.btnNextSlide.disabled = currentSlideIndex === slides.length - 1;

    // Reset scroll position to top to prevent content being hidden
    document.getElementById('slides-container').scrollTop = 0;
  }

  navigateSlide(direction) {
    const newIndex = this.slideState.currentSlideIndex + direction;
    if (newIndex >= 0 && newIndex < this.slideState.slides.length) {
      this.slideState.currentSlideIndex = newIndex;
      this.renderSlide();
      this.updateChaptersPanelActive();
    }
  }

  goToSlide(index) {
    if (index >= 0 && index < this.slideState.slides.length) {
      this.slideState.currentSlideIndex = index;
      this.renderSlide();
      this.updateChaptersPanelActive();
    }
  }

  populateChaptersPanel() {
    const { slides, currentModule } = this.slideState;
    const panel = this.elements.chaptersPanelContent;

    let html = '';
    slides.forEach((slide, index) => {
      html += `<button class="chapter-item sub-chapter ${index === 0 ? 'active' : ''}" data-slide-index="${index}">${slide.title}</button>`;
    });

    html += `<button class="chapter-item visualizer-link" id="btn-go-to-visualizer">🎯 Go to Visualization</button>`;

    panel.innerHTML = html;

    panel.querySelectorAll('.chapter-item[data-slide-index]').forEach((btn) => {
      btn.addEventListener('click', () => this.goToSlide(parseInt(btn.dataset.slideIndex, 10)));
    });

    document.getElementById('btn-go-to-visualizer').addEventListener('click', () => this.goToVisualizer());
  }

  updateChaptersPanelActive() {
    const { currentSlideIndex } = this.slideState;
    this.elements.chaptersPanelContent.querySelectorAll('.chapter-item[data-slide-index]').forEach((btn, index) => {
      btn.classList.toggle('active', index === currentSlideIndex);
    });
  }

  goToVisualizer() {
    if (this.currentModule === 'array') {
      this.elements.modalTitle.textContent = 'Configure Array';
      this.elements.modalDesc.textContent = 'Enter the array size and optional values. Values are comma-separated.';
      this.elements.modalLabel.textContent = 'Array Values';
      this.elements.modalInput.value = '10, 20, 30, 40, 50';
      this.elements.modalSizeField.style.display = 'block';
      this.elements.modalSize.value = '5';
    } else {
      this.elements.modalTitle.textContent = 'Configure Linked List';
      this.elements.modalDesc.textContent = 'Enter comma-separated node values or press Visualize to use the default.';
      this.elements.modalLabel.textContent = 'Node Values';
      this.elements.modalInput.value = '10, 20, 30, 40, 50';
      this.elements.modalSizeField.style.display = 'none';
      this.elements.modalSize.value = '5';
    }

    this.elements.inputModal.showModal();
    this.elements.modalInput.focus();
    this.elements.modalInput.select();
  }

  launchVisualizer(values, capacity) {
    this.showScreen('visualizer');

    const { vizContainer, statusMessage, infoStrip } = this.elements;

    if (this.currentModule === 'array') {
      this.elements.vizTitle.textContent = 'Array Visualizer';
      this.visualizer = new ArrayVisualizer(vizContainer, this.anim, statusMessage, infoStrip);
      this.visualizer.onCellClick = (index) => this.showContextMenu(index, 'array');
      this.visualizer.init(values, capacity);
      this.updateCodePanel('create', null, null, null, values, capacity);
    } else {
      this.elements.vizTitle.textContent = 'Linked List Visualizer';
      this.visualizer = new LinkedListVisualizer(vizContainer, this.anim, statusMessage, infoStrip);
      this.visualizer.onNodeClick = (index) => this.showContextMenu(index, 'linkedlist');
      this.visualizer.init(values);
      this.updateCodePanel('create', null, null, null, values, null);
    }
  }

  _parseValues(str) {
    return str
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => {
        const num = Number(s);
        return Number.isNaN(num) ? s : num;
      });
  }

  _buildArrayValues(values, size) {
    const result = values.slice(0, size);
    for (let i = result.length; i < size; i += 1) {
      result.push(i + 1);
    }
    return result;
  }

  showContextMenu(index, type) {
    this.contextTarget = { index, type };
    const menu = this.elements.contextMenu;
    menu.hidden = false;

    const cellSelector = type === 'array'
      ? `.array-cell[data-index="${index}"]`
      : `.ll-node[data-index="${index}"]`;
    const target = this.elements.vizContainer.querySelector(cellSelector);

    if (target) {
      const tr = target.getBoundingClientRect();
      let left = tr.left + tr.width / 2 - 110;
      let top = tr.bottom + 8;
      left = Math.max(8, Math.min(left, window.innerWidth - 240));
      top = Math.min(top, window.innerHeight - 320);
      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;
    }

    this.elements.overlay.hidden = false;
  }

  hideContextMenu() {
    this.elements.contextMenu.hidden = true;
    this.elements.overlay.hidden = true;
    this.contextTarget = null;
  }

  _handleContextAction(action, target) {
    if (!this.visualizer) return;
    const { index } = target;

    switch (action) {
      case 'insert-before':
        this._promptOperation('Insert Before', 'Value to insert?', '99', (val) => {
          this.updateCodePanel('insert', val, index, 'before');
          this.visualizer.guard(() => this.visualizer.insertAt(index, val, 'before'));
        });
        break;
      case 'insert-after':
        this._promptOperation('Insert After', 'Value to insert?', '99', (val) => {
          this.updateCodePanel('insert', val, index, 'after');
          this.visualizer.guard(() => this.visualizer.insertAt(index, val, 'after'));
        });
        break;
      case 'delete':
        this.updateCodePanel('delete', null, index);
        this.visualizer.guard(() => this.visualizer.deleteAt(index));
        break;
      case 'update': {
        const current = this.currentModule === 'array'
          ? this.visualizer.data[index]
          : this.visualizer.nodes[index].value;
        this._promptOperation('Update Value', 'New value?', String(current), (val) => {
          this.updateCodePanel('update', val, index);
          this.visualizer.guard(() => this.visualizer.updateAt(index, val));
        });
        break;
      }
      case 'highlight':
        this.updateCodePanel('highlight', null, index);
        this.visualizer.highlightAt(index);
        break;
    }
  }

  _promptOperation(title, desc, defaultVal, callback) {
    this.elements.operationTitle.textContent = title;
    this.elements.operationDesc.textContent = desc;
    this.elements.operationInput.value = defaultVal;
    this._operationCallback = callback;
    this.elements.operationModal.showModal();
    this.elements.operationInput.focus();
    this.elements.operationInput.select();
  }

  async _handleOperationConfirm() {
    const raw = this.elements.operationInput.value.trim();
    if (!raw) return;
    const num = Number(raw);
    const val = Number.isNaN(num) ? raw : num;
    const cb = this._operationCallback;
    this._operationCallback = null;
    this.elements.operationModal.close();
    if (cb) await cb(val);
  }
}

const ModuleRegistry = {
  array: { title: 'Arrays', Visualizer: ArrayVisualizer },
  linkedlist: { title: 'Linked Lists', Visualizer: LinkedListVisualizer },
};

window.ModuleRegistry = ModuleRegistry;
