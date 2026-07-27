/**
 * Data Structures Visualizer
 * Main Application Controller
 */

class App {
  constructor() {
    // Prevent double-binding if App is instantiated multiple times
    if (window._appBound) return;
    window._appBound = true;

    this.anim = new AnimationController();
    this.presentationAnim = new AnimationController(); // Separate controller for presentation
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
      dashboard: document.getElementById('screen-dashboard'),
      presentationViewer: document.getElementById('screen-presentation-viewer'),
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
      toastContainer: document.getElementById('toast-container'),
    };

    this.slideState = {
      currentModule: null,
      currentSlideIndex: 0,
      slides: [],
    };

    this.initialValues = [];
    this.initialCapacity = 5;
    this.currentPresentation = null;
    this.currentPresentationData = null;
    this.presentationVisualizer = null;
    this.presentationViewMode = 'slides'; // 'slides' or 'visualizer'
    this.isReadOnly = false;
    this.isPublicView = false;
    this._bindEvents();
  }

  // ===== Toast Notification System =====

  showToast(message, type = 'info') {
    const container = this.elements.toastContainer;
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
  }

  // ===== Auth Helper =====

  _authHeaders() {
    const token = typeof Auth !== 'undefined' ? Auth.getSessionToken() : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
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

    // Dashboard button — single listener (fixes duplicate listener bug)
    document.getElementById('btn-dashboard').addEventListener('click', () => {
      this.showScreen('dashboard');
      this.loadPresentations();
    });

    document.getElementById('btn-back-modules').addEventListener('click', () => this.showScreen('home'));
    document.getElementById('btn-back-slides').addEventListener('click', () => this.showScreen('modules'));
    document.getElementById('btn-back-viz').addEventListener('click', () => {
      this.anim.abort();
      this.hideContextMenu();
      this.showScreen('slides');
    });
    document.getElementById('btn-back-dashboard').addEventListener('click', () => this.showScreen('home'));
    document.getElementById('btn-back-presentation').addEventListener('click', () => {
      if (this.isPublicView) {
        // Public viewers go to home (no dashboard access)
        this.showScreen('home');
      } else {
        this.showScreen('dashboard');
      }
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

    // Speed buttons — scoped to visualizer screen only
    document.querySelectorAll('#screen-visualizer .btn-speed').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#screen-visualizer .btn-speed').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.anim.setSpeed(btn.dataset.speed);
      });
    });

    // Speed buttons — scoped to presentation viewer
    document.querySelectorAll('#screen-presentation-viewer .btn-speed').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#screen-presentation-viewer .btn-speed').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.presentationAnim.setSpeed(btn.dataset.speed);
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
        this.visualizer.reset([...this.initialValues], this.initialCapacity);
        this.elements.codePanelContent.textContent = `// Click on an operation to see the ${this.currentLanguage === 'python' ? 'Python' : 'C'} code`;
      }
    });

    this.elements.codePanelClose.addEventListener('click', () => {
      this.elements.codePanelContent.textContent = `// Click on an operation to see the ${this.currentLanguage === 'python' ? 'Python' : 'C'} code`;
    });

    // Language switcher — scoped to main visualizer
    document.querySelectorAll('#screen-visualizer .lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        this.currentLanguage = lang;

        document.querySelectorAll('#screen-visualizer .lang-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        if (this.currentOperation) {
          const { operation, value, index, position, values, capacity } = this.currentOperation;
          this.updateCodePanel(operation, value, index, position, values, capacity);
        } else if (this.visualizer && this.currentModule) {
          this.elements.codePanelContent.textContent = `// Click on an operation to see the ${lang === 'python' ? 'Python' : 'C'} code`;
        }
      });
    });

    // Language switcher — scoped to presentation viewer
    document.querySelectorAll('#screen-presentation-viewer .lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        this.currentLanguage = lang;

        document.querySelectorAll('#screen-presentation-viewer .lang-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const codeContent = document.getElementById('presentation-code-content');
        if (this.currentOperation && this.currentModule) {
          const templates = lang === 'python'
            ? PythonCodeTemplates[this.currentModule]
            : CCodeTemplates[this.currentModule];
          if (templates && templates[this.currentOperation.operation]) {
            const { operation, value, index, position, values, capacity } = this.currentOperation;
            let code;
            if (operation === 'create') code = templates.create(values, capacity);
            else if (operation === 'traverse') code = templates.traverse();
            else if (operation === 'search') code = templates.search(value);
            if (code) codeContent.textContent = code;
          }
        } else {
          codeContent.textContent = `// Click on an operation to see the ${lang === 'python' ? 'Python' : 'C'} code`;
        }
      });
    });

    this.elements.btnPrevSlide.addEventListener('click', () => this.navigateSlide(-1));
    this.elements.btnNextSlide.addEventListener('click', () => this.navigateSlide(1));

    // Dashboard events
    const createBtn = document.getElementById('btn-create-presentation');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        document.getElementById('create-viz-type').value = 'array';
        document.getElementById('create-viz-size-group').style.display = 'block';
        this.showCreatePresentationModal();
      });
    }

    const createVizType = document.getElementById('create-viz-type');
    if (createVizType) {
      createVizType.addEventListener('change', (e) => {
        document.getElementById('create-viz-size-group').style.display = 
          e.target.value === 'array' ? 'block' : 'none';
      });
    }

    const cancelBtn = document.getElementById('create-presentation-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        document.getElementById('create-presentation-form').reset();
        document.getElementById('create-presentation-modal').close();
      });
    }

    const createForm = document.getElementById('create-presentation-form');
    if (createForm) {
      createForm.addEventListener('submit', (e) => this.handleCreatePresentation(e));
    }

    // Presentation viewer events
    const toggleViewBtn = document.getElementById('btn-toggle-view');
    if (toggleViewBtn) {
      toggleViewBtn.addEventListener('click', () => this.togglePresentationView());
    }

    const shareBtn = document.getElementById('btn-share');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => this.showShareModal());
    }

    const shareCancelBtn = document.getElementById('share-cancel');
    if (shareCancelBtn) {
      shareCancelBtn.addEventListener('click', () => {
        document.getElementById('share-modal').close();
      });
    }

    const shareCopyBtn = document.getElementById('share-copy');
    if (shareCopyBtn) {
      shareCopyBtn.addEventListener('click', () => this.copyShareLink());
    }

    // Presentation visualizer controls
    const presTraverse = document.getElementById('presentation-btn-traverse');
    if (presTraverse) {
      presTraverse.addEventListener('click', () => {
        if (this.presentationVisualizer) {
          this.presentationVisualizer.guard(() => this.presentationVisualizer.traverse());
        }
      });
    }

    const presSearch = document.getElementById('presentation-btn-search');
    if (presSearch) {
      presSearch.addEventListener('click', () => {
        if (!this.presentationVisualizer) return;
        this._promptOperation(
          'Search',
          'Find value in the data structure',
          this.presentationVisualizer.searchDefault,
          (val) => {
            this.presentationVisualizer.guard(() => this.presentationVisualizer.search(val));
          }
        );
      });
    }

    const presReset = document.getElementById('presentation-btn-reset');
    if (presReset) {
      presReset.addEventListener('click', () => {
        if (this.presentationVisualizer) {
          this.presentationVisualizer.reset(
            [...(this.presentationInitialValues || [10, 20, 30, 40, 50])],
            this.presentationInitialCapacity
          );
        }
      });
    }

    // Save config button
    const saveConfigBtn = document.getElementById('presentation-btn-save-config');
    if (saveConfigBtn) {
      saveConfigBtn.addEventListener('click', () => this.saveSlideConfig());
    }
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

    // Use escapeHtml for the title to prevent XSS
    this.elements.slideContent.innerHTML = `
      <h2 class="slide-title">${this.escapeHtml(slide.title)}</h2>
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
      html += `<button class="chapter-item sub-chapter ${index === 0 ? 'active' : ''}" data-slide-index="${index}">${this.escapeHtml(slide.title)}</button>`;
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

  // ===== Presentation Management =====

  async loadPresentations() {
    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    if (!user) return;

    const container = document.getElementById('presentations-list');
    container.innerHTML = '<div class="loading-placeholder">Loading presentations…</div>';

    try {
      const response = await fetch(`${window.AUTH_CONFIG.baseUrl}/get-presentations`, {
        method: 'POST',
        headers: this._authHeaders(),
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (!data.ok) throw new Error(data.error);

      this.renderPresentationsList(data.presentations || []);
    } catch (error) {
      console.error('Failed to load presentations:', error);
      this.showToast('Failed to load presentations', 'error');
      this.renderPresentationsList([]);
    }
  }

  renderPresentationsList(presentations) {
    const container = document.getElementById('presentations-list');

    if (!presentations || presentations.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <p>No presentations yet. Create your first one!</p>
        </div>
      `;
      return;
    }

    // Use data attributes + event delegation instead of inline onclick
    container.innerHTML = presentations.map(p => `
      <div class="presentation-card">
        <div class="presentation-card-info">
          <div class="presentation-card-title">${this.escapeHtml(p.title)}</div>
          ${p.description ? `<div class="presentation-card-desc">${this.escapeHtml(p.description)}</div>` : ''}
          <div class="presentation-card-date">Created: ${new Date(p.created_at).toLocaleDateString()}</div>
        </div>
        <div class="presentation-card-actions">
          <button class="btn-primary" data-action="open" data-id="${p.id}" data-token="${p.share_token}">Open</button>
          <button class="btn-secondary" data-action="delete" data-id="${p.id}">Delete</button>
        </div>
      </div>
    `).join('');

    // Event delegation for presentation actions
    container.addEventListener('click', (e) => {
      const openBtn = e.target.closest('[data-action="open"]');
      const deleteBtn = e.target.closest('[data-action="delete"]');
      if (openBtn) {
        this.openPresentation(openBtn.dataset.id, openBtn.dataset.token);
      } else if (deleteBtn) {
        this.deletePresentation(deleteBtn.dataset.id);
      }
    }, { once: false });
  }

  showCreatePresentationModal() {
    document.getElementById('create-presentation-modal').showModal();
    document.getElementById('create-presentation-title-input').focus();
  }

  async handleCreatePresentation(e) {
    e.preventDefault();

    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    if (!user) return;

    const title = document.getElementById('create-presentation-title-input').value.trim();
    const description = document.getElementById('presentation-description').value.trim();
    const googleSlidesUrl = document.getElementById('presentation-url').value.trim();
    const vizType = document.getElementById('create-viz-type').value;
    const vizValuesRaw = document.getElementById('create-viz-values').value;
    
    let vizValues = this._parseValues(vizValuesRaw);
    let vizCapacity = null;
    
    if (vizType === 'array') {
      let size = parseInt(document.getElementById('create-viz-size').value, 10);
      size = Number.isNaN(size) || size < 1 ? 5 : Math.min(Math.max(size, 1), 20);
      vizValues = this._buildArrayValues(vizValues, size);
      vizCapacity = size;
    }

    if (!title || !googleSlidesUrl) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }

    const submitBtn = document.getElementById('create-presentation-submit');
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating…';

    try {
      const response = await fetch(`${window.AUTH_CONFIG.baseUrl}/create-presentation`, {
        method: 'POST',
        headers: this._authHeaders(),
        body: JSON.stringify({
          title,
          description,
          google_slides_url: googleSlidesUrl,
          visualizer_type: vizType,
          visualizer_config: {
            values: vizValues,
            ...(vizCapacity !== null && { capacity: vizCapacity })
          }
        }),
      });

      const data = await response.json();
      if (!data.ok) throw new Error(data.error);

      document.getElementById('create-presentation-modal').close();
      document.getElementById('create-presentation-form').reset();
      this.showToast('Presentation created successfully!', 'success');
      this.loadPresentations();
    } catch (error) {
      this.showToast('Failed to create presentation: ' + error.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  async openPresentation(presentationId, shareToken) {
    this.currentPresentation = { id: presentationId, share_token: shareToken };
    this.isPublicView = false;

    try {
      const response = await fetch(`${window.AUTH_CONFIG.baseUrl}/get-public-presentation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share_token: shareToken }),
      });

      const data = await response.json();
      if (!data.ok) throw new Error(data.error);

      const presentation = data.presentation;
      // Use the correct ID (renamed from duplicate)
      document.getElementById('presentation-viewer-title').textContent = presentation.title;

      // Set up Google Slides iframe
      const embedUrl = this.getGoogleSlidesEmbedUrl(presentation.google_slides_url);
      document.getElementById('google-slides-iframe').src = embedUrl;

      // Initialize presentation visualizer with slide config or defaults
      this.initPresentationVisualizer(presentation.slide_configs);

      this.showScreen('presentationViewer');
      this.currentPresentationData = presentation;
      this.setReadOnlyMode(false);
    } catch (error) {
      this.showToast('Failed to load presentation: ' + error.message, 'error');
    }
  }

  initPresentationVisualizer(slideConfigs = null) {
    const vizContainer = document.getElementById('presentation-viz-canvas');
    const statusMessage = document.getElementById('presentation-status-message');
    const infoStrip = document.getElementById('presentation-info-strip');

    // Ensure we start in slides mode
    const iframeContainer = document.getElementById('slides-iframe-container');
    const fullVizContainer = document.getElementById('presentation-viz-container');
    const codePanel = document.getElementById('presentation-code-panel');
    if (iframeContainer) iframeContainer.hidden = false;
    if (fullVizContainer) fullVizContainer.hidden = true;
    if (codePanel) codePanel.hidden = true;
    this.presentationViewMode = 'slides';

    // Try to use slide config if available
    let vizType = 'array';
    let vizValues = [10, 20, 30, 40, 50];
    let vizCapacity = 10;

    if (slideConfigs && Array.isArray(slideConfigs) && slideConfigs.length > 0) {
      const config = slideConfigs[0]; // Use first slide config
      if (config.visualizer_type) vizType = config.visualizer_type;
      if (config.visualizer_config) {
        if (config.visualizer_config.values) vizValues = config.visualizer_config.values;
        if (config.visualizer_config.capacity) vizCapacity = config.visualizer_config.capacity;
      }
    }

    this.presentationInitialValues = [...vizValues];
    this.presentationInitialCapacity = vizCapacity;

    // Set currentModule for code panel operations
    this.currentModule = vizType === 'linkedlist' ? 'linkedlist' : 'array';

    if (vizType === 'linkedlist') {
      this.presentationVisualizer = new LinkedListVisualizer(
        vizContainer, this.presentationAnim, statusMessage, infoStrip
      );
      this.presentationVisualizer.init(vizValues);
    } else {
      this.presentationVisualizer = new ArrayVisualizer(
        vizContainer, this.presentationAnim, statusMessage, infoStrip
      );
      this.presentationVisualizer.init(vizValues, vizCapacity);
    }
  }

  getGoogleSlidesEmbedUrl(url) {
    // Convert regular Google Slides URL to embed format
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const slideId = match[1];
      return `https://docs.google.com/presentation/d/${slideId}/embed`;
    }
    return url;
  }

  togglePresentationView() {
    const iframeContainer = document.getElementById('slides-iframe-container');
    const vizContainer = document.getElementById('presentation-viz-container');
    const codePanel = document.getElementById('presentation-code-panel');

    if (iframeContainer.hidden) {
      // Switch to slides view
      iframeContainer.hidden = false;
      vizContainer.hidden = true;
      if (codePanel) codePanel.hidden = true;
      this.presentationViewMode = 'slides';
    } else {
      // Switch to visualizer view
      iframeContainer.hidden = true;
      vizContainer.hidden = false;
      if (codePanel) codePanel.hidden = false;
      this.presentationViewMode = 'visualizer';
    }
  }

  showShareModal() {
    if (!this.currentPresentation) return;

    const shareUrl = `${window.location.origin}/present/${this.currentPresentation.share_token}`;
    document.getElementById('share-url').value = shareUrl;
    document.getElementById('share-modal').showModal();
  }

  async copyShareLink() {
    const shareUrlInput = document.getElementById('share-url');
    try {
      await navigator.clipboard.writeText(shareUrlInput.value);
      this.showToast('Link copied to clipboard!', 'success');
    } catch {
      // Fallback for older browsers
      shareUrlInput.select();
      try {
        document.execCommand('copy');
        this.showToast('Link copied to clipboard!', 'success');
      } catch {
        this.showToast('Failed to copy link. Please copy manually.', 'error');
      }
    }
  }

  async deletePresentation(presentationId) {
    if (!confirm('Are you sure you want to delete this presentation?')) return;

    try {
      const response = await fetch(`${window.AUTH_CONFIG.baseUrl}/delete-presentation`, {
        method: 'POST',
        headers: this._authHeaders(),
        body: JSON.stringify({ presentation_id: presentationId }),
      });

      const data = await response.json();
      if (!data.ok) throw new Error(data.error);

      this.showToast('Presentation deleted', 'success');
      this.loadPresentations();
    } catch (error) {
      this.showToast('Failed to delete: ' + error.message, 'error');
    }
  }

  async saveSlideConfig() {
    if (!this.currentPresentation || !this.presentationVisualizer) return;

    const vizType = this.presentationVisualizer instanceof LinkedListVisualizer
      ? 'linkedlist' : 'array';

    let vizConfig;
    if (vizType === 'array') {
      vizConfig = {
        values: [...this.presentationVisualizer.data],
        capacity: this.presentationVisualizer.capacity,
      };
    } else {
      vizConfig = {
        values: this.presentationVisualizer.nodes.map(n => n.value),
      };
    }

    try {
      const response = await fetch(`${window.AUTH_CONFIG.baseUrl}/save-slide-config`, {
        method: 'POST',
        headers: this._authHeaders(),
        body: JSON.stringify({
          presentation_id: this.currentPresentation.id,
          slide_number: 0, // Default to first slide
          visualizer_type: vizType,
          visualizer_config: vizConfig,
        }),
      });

      const data = await response.json();
      if (!data.ok) throw new Error(data.error);

      this.showToast('Configuration saved!', 'success');
    } catch (error) {
      this.showToast('Failed to save config: ' + error.message, 'error');
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ===== Public Presentation Access =====

  async loadPublicPresentation(shareToken) {
    this.isPublicView = true;

    try {
      const response = await fetch(`${window.AUTH_CONFIG.baseUrl}/get-public-presentation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share_token: shareToken }),
      });

      const data = await response.json();
      if (!data.ok) throw new Error(data.error);

      const presentation = data.presentation;
      document.getElementById('presentation-viewer-title').textContent = presentation.title;

      // Set up Google Slides iframe
      const embedUrl = this.getGoogleSlidesEmbedUrl(presentation.google_slides_url);
      document.getElementById('google-slides-iframe').src = embedUrl;

      // Initialize in read-only mode
      this.initPresentationVisualizer(presentation.slide_configs);
      this.setReadOnlyMode(true);

      this.showScreen('presentationViewer');
      this.currentPresentationData = presentation;
      this.currentPresentation = { share_token: shareToken };
    } catch (error) {
      this.showToast('Failed to load presentation: ' + error.message, 'error');
      this.showScreen('home');
    }
  }

  setReadOnlyMode(isReadOnly) {
    this.isReadOnly = isReadOnly;

    // Hide save config button for public viewers
    const saveConfigBtn = document.getElementById('presentation-btn-save-config');
    if (saveConfigBtn) {
      saveConfigBtn.hidden = isReadOnly;
    }

    // Hide share button for public viewers
    const shareBtn = document.getElementById('btn-share');
    if (shareBtn) {
      shareBtn.hidden = isReadOnly;
    }

    // Update back button behavior for public viewers
    const backBtn = document.getElementById('btn-back-presentation');
    if (backBtn && isReadOnly) {
      backBtn.textContent = '← Home';
    } else if (backBtn) {
      backBtn.textContent = '← Back';
    }
  }
}

// App is created by auth.js — no ModuleRegistry needed (removed dead code)
