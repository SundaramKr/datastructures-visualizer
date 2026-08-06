/**
 * Data Structures Visualizer
 * Main Application Controller
 */

class App {
  constructor() {
    // Prevent double-binding if App is instantiated multiple times
    if (window._appBound) return;
    window._appBound = true;

    this.currentModule = null;
    this.contextTarget = null;
    this._operationCallback = null;
    this.currentLanguage = 'c';

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
      btnReverse: document.getElementById('btn-reverse'),
      btnReset: document.getElementById('btn-reset'),
      btnToggleMode: document.getElementById('btn-toggle-mode'),
      btnStepForward: document.getElementById('btn-step-forward'),
      btnAbort: document.getElementById('btn-abort'),
      stepControls: document.getElementById('step-controls'),
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
    this.presentationViewMode = 'slides'; // 'slides' or 'visualizer'
    this.isReadOnly = false;
    this.isPublicView = false;
    this._initVisualizerControllers();
    this._bindEvents();
  }

  _initVisualizerControllers() {
    const sharedConfig = {
      getLanguage: () => this.currentLanguage,
      promptOperation: (title, desc, defaultVal, cb) => this._promptOperation(title, desc, defaultVal, cb),
      onNodeClick: (index, type) => this.showContextMenu(index, type),
    };

    this.dsController = new VisualizerController({
      ...sharedConfig,
      container: this.elements.vizContainer,
      statusEl: this.elements.statusMessage,
      codePanelEl: this.elements.codePanelContent,
      screenRoot: this.screens.visualizer,
      buttons: {
        traverse: this.elements.btnTraverse,
        search: this.elements.btnSearch,
        reverse: this.elements.btnReverse,
        reset: this.elements.btnReset,
        toggleMode: this.elements.btnToggleMode,
        stepForward: this.elements.btnStepForward,
        abort: this.elements.btnAbort,
      },
    });

    this.presController = new VisualizerController({
      ...sharedConfig,
      container: document.getElementById('presentation-viz-canvas'),
      statusEl: document.getElementById('presentation-status-message'),
      codePanelEl: document.getElementById('presentation-code-content'),
      screenRoot: this.screens.presentationViewer,
      buttons: {
        traverse: document.getElementById('presentation-btn-traverse'),
        search: document.getElementById('presentation-btn-search'),
        reverse: document.getElementById('presentation-btn-reverse'),
        reset: document.getElementById('presentation-btn-reset'),
        toggleMode: document.getElementById('presentation-btn-toggle-mode'),
        stepForward: document.getElementById('presentation-btn-step-forward'),
        abort: document.getElementById('presentation-btn-abort'),
      },
    });
  }

  _getActiveController() {
    if (this.screens.presentationViewer.classList.contains('active')) {
      return this.presController;
    }
    if (this.screens.visualizer.classList.contains('active')) {
      return this.dsController;
    }
    return null;
  }

  /** @deprecated Use dsController.visualizer — kept for compatibility */
  get visualizer() {
    return this.dsController?.visualizer ?? null;
  }

  /** @deprecated Use presController.visualizer — kept for compatibility */
  get presentationVisualizer() {
    return this.presController?.visualizer ?? null;
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
      this.dsController.anim.abort();
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

    this.elements.codePanelClose.addEventListener('click', () => {
      this.dsController.resetCodePanelText();
    });

    // Language switcher
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (this.dsController.visualizer?.busy) return;
        if (this.presController.visualizer?.busy) return;

        const lang = btn.dataset.lang;
        this.currentLanguage = lang;

        document.querySelectorAll('.lang-btn').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));

        this._getActiveController()?.refreshCodePanel();
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

    const editVizType = document.getElementById('edit-viz-type');
    if (editVizType) {
      editVizType.addEventListener('change', (e) => {
        document.getElementById('edit-viz-size-group').style.display =
          e.target.value === 'array' ? 'block' : 'none';
      });
    }

    const editCancelBtn = document.getElementById('edit-presentation-cancel');
    if (editCancelBtn) {
      editCancelBtn.addEventListener('click', () => {
        document.getElementById('edit-presentation-form').reset();
        document.getElementById('edit-presentation-modal').close();
      });
    }

    const editForm = document.getElementById('edit-presentation-form');
    if (editForm) {
      editForm.addEventListener('submit', (e) => this.handleEditPresentation(e));
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

    // Save config button (presentation-only)
    const saveConfigBtn = document.getElementById('presentation-btn-save-config');
    if (saveConfigBtn) {
      saveConfigBtn.addEventListener('click', () => this.saveSlideConfig());
    }
  }

  showScreen(name) {
    Object.values(this.screens).forEach((s) => s.classList.remove('active'));
    this.screens[name].classList.add('active');
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
      this.elements.slideContent.replaceChildren();
      const p = document.createElement('p');
      p.className = 'slide-text';
      p.textContent = 'No slides available.';
      this.elements.slideContent.appendChild(p);
      return;
    }

    // Use DOMParser to safely parse HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(`
      <h2 class="slide-title">${this.escapeHtml(slide.title)}</h2>
      ${slide.content}
    `, 'text/html');
    this.elements.slideContent.replaceChildren(...doc.body.childNodes);

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

    panel.replaceChildren();

    slides.forEach((slide, index) => {
      const btn = document.createElement('button');
      btn.className = `chapter-item sub-chapter ${index === 0 ? 'active' : ''}`;
      btn.dataset.slideIndex = index;
      btn.textContent = slide.title; // Secure text assignment
      btn.addEventListener('click', () => this.goToSlide(index));
      panel.appendChild(btn);
    });

    const visBtn = document.createElement('button');
    visBtn.className = 'chapter-item visualizer-link';
    visBtn.id = 'btn-go-to-visualizer';
    visBtn.textContent = '🎯 Go to Visualization';
    visBtn.addEventListener('click', () => this.goToVisualizer());
    panel.appendChild(visBtn);
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

    if (this.currentModule === 'array') {
      this.elements.vizTitle.textContent = 'Array Visualizer';
      this.dsController.launch('array', values, capacity);
    } else {
      this.elements.vizTitle.textContent = 'Linked List Visualizer';
      this.dsController.launch('linkedlist', values);
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
    return values.slice(0, size);
  }

  showContextMenu(index, type) {
    this.contextTarget = { index, type };
    const menu = this.elements.contextMenu;
    menu.hidden = false;

    const cellSelector = type === 'array'
      ? `.array-cell[data-index="${index}"]`
      : `.ll-node[data-index="${index}"]`;

    const container = this.screens.presentationViewer.classList.contains('active')
      ? document.getElementById('presentation-viz-canvas')
      : this.elements.vizContainer;

    const target = container.querySelector(cellSelector);

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
    const controller = this.screens.presentationViewer.classList.contains('active')
      ? this.presController
      : this.dsController;
    if (!controller.visualizer) return;
    controller.handleContextAction(action, target.index);
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

      this.presentationsData = data.presentations || [];
      this.renderPresentationsList(this.presentationsData);
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
          <button class="btn-secondary" data-action="edit" data-id="${p.id}">Edit</button>
          <button class="btn-secondary" data-action="delete" data-id="${p.id}">Delete</button>
        </div>
      </div>
    `).join('');

    // Event delegation for presentation actions (using onclick to prevent duplicates)
    container.onclick = (e) => {
      const openBtn = e.target.closest('[data-action="open"]');
      const editBtn = e.target.closest('[data-action="edit"]');
      const deleteBtn = e.target.closest('[data-action="delete"]');
      if (openBtn) {
        this.openPresentation(openBtn.dataset.id, openBtn.dataset.token);
      } else if (editBtn) {
        this.openEditModal(editBtn.dataset.id);
      } else if (deleteBtn) {
        this.deletePresentation(deleteBtn.dataset.id);
      }
    };
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
    const shareToken = document.getElementById('presentation-share-token').value.trim();
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

    if (!title || !googleSlidesUrl || !shareToken) {
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
          share_token: shareToken,
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

  openEditModal(presentationId) {
    const p = this.presentationsData.find(x => x.id === presentationId);
    if (!p) return;

    document.getElementById('edit-presentation-id').value = p.id;
    document.getElementById('edit-presentation-title-input').value = p.title;
    document.getElementById('edit-presentation-description').value = p.description || '';
    document.getElementById('edit-presentation-url').value = p.google_slides_url;
    document.getElementById('edit-presentation-share-token').value = p.share_token;
    // Load slide config for slide 0 if it exists
    let vizType = 'array';
    let vizValues = '10, 20, 30, 40, 50';
    let vizCapacity = 10;

    if (p.slide_configs && p.slide_configs.length > 0) {
      const slide0 = p.slide_configs.find(s => s.slide_number === 0);
      if (slide0) {
        vizType = slide0.visualizer_type || 'array';
        if (slide0.visualizer_config) {
          if (slide0.visualizer_config.values) {
            vizValues = slide0.visualizer_config.values.join(', ');
          }
          if (slide0.visualizer_config.capacity) {
            vizCapacity = slide0.visualizer_config.capacity;
          }
        }
      }
    }

    document.getElementById('edit-viz-type').value = vizType;
    document.getElementById('edit-viz-values').value = vizValues;
    document.getElementById('edit-viz-size').value = vizCapacity;
    document.getElementById('edit-viz-size-group').style.display = vizType === 'array' ? 'block' : 'none';
    document.getElementById('edit-presentation-modal').showModal();
  }

  async handleEditPresentation(e) {
    e.preventDefault();
    const id = document.getElementById('edit-presentation-id').value;
    const title = document.getElementById('edit-presentation-title-input').value.trim();
    const description = document.getElementById('edit-presentation-description').value.trim();
    const googleSlidesUrl = document.getElementById('edit-presentation-url').value.trim();
    const shareToken = document.getElementById('edit-presentation-share-token').value.trim();
    const vizType = document.getElementById('edit-viz-type').value;
    const vizValuesRaw = document.getElementById('edit-viz-values').value;

    let vizValues = this._parseValues(vizValuesRaw);
    let vizCapacity = null;

    if (vizType === 'array') {
      let size = parseInt(document.getElementById('edit-viz-size').value, 10);
      size = Number.isNaN(size) || size < 1 ? 5 : Math.min(Math.max(size, 1), 20);
      vizValues = this._buildArrayValues(vizValues, size);
      vizCapacity = size;
    }

    if (!title || !googleSlidesUrl || !shareToken) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }

    const submitBtn = document.getElementById('edit-presentation-submit');
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Updating…';

    try {
      const response = await fetch(`${window.AUTH_CONFIG.baseUrl}/update-presentation`, {
        method: 'POST',
        headers: this._authHeaders(),
        body: JSON.stringify({
          presentation_id: id,
          title,
          description,
          google_slides_url: googleSlidesUrl,
          share_token: shareToken,
          visualizer_type: vizType,
          visualizer_config: {
            values: vizValues,
            ...(vizCapacity !== null && { capacity: vizCapacity })
          }
        }),
      });

      const data = await response.json();
      if (!data.ok) throw new Error(data.error);

      document.getElementById('edit-presentation-modal').close();
      document.getElementById('edit-presentation-form').reset();
      this.showToast('Presentation updated successfully!', 'success');
      this.loadPresentations();
    } catch (error) {
      this.showToast('Failed to update presentation: ' + error.message, 'error');
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

    // Set currentModule for slides/code panel context
    this.currentModule = vizType === 'linkedlist' ? 'linkedlist' : 'array';

    if (vizType === 'linkedlist') {
      this.presController.launch('linkedlist', vizValues);
    } else {
      this.presController.launch('array', vizValues, vizCapacity);
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
      this.showToast('Failed to copy link. Please copy manually.', 'error');
      shareUrlInput.select();
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
    if (!this.currentPresentation || !this.presController.visualizer) return;

    const viz = this.presController.visualizer;
    const vizType = viz instanceof LinkedListVisualizer ? 'linkedlist' : 'array';

    let vizConfig;
    if (vizType === 'array') {
      vizConfig = {
        values: [...viz.data],
        capacity: viz.capacity,
      };
    } else {
      vizConfig = {
        values: viz.nodes.map(n => n.value),
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

    // Hide back button for public viewers
    const backBtn = document.getElementById('btn-back-presentation');
    if (backBtn) {
      backBtn.hidden = isReadOnly;
    }
  }
}

// App is created by auth.js — no ModuleRegistry needed (removed dead code)
