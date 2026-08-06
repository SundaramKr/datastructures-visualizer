class LinkedListVisualizer extends BaseVisualizer {
  static nextId = 0;

  static generateAddress() {
    const hex = Math.floor(Math.random() * 0xFFF + 0x100)
      .toString(16)
      .toUpperCase()
      .padStart(3, '0');
    return `0x${hex}`;
  }

  constructor(container, anim, statusEl) {
    super(container, anim, statusEl);
    this.head = null;
    this.nodes = [];
    this.searchDefault = '40';
    this.onNodeClick = null;
    this._traceNewNode = null;
    this._floatingNode = null;
    this._pointerLabels = [];
    this._decisionState = null;
  }

  _uniqueAddress() {
    const used = new Set(this.nodes.map((n) => n.address));
    let addr;
    do {
      addr = LinkedListVisualizer.generateAddress();
    } while (used.has(addr));
    return addr;
  }

  _linkNodes() {
    this.nodes.forEach((node, i) => {
      node.next = i < this.nodes.length - 1 ? this.nodes[i + 1] : null;
    });
    this.head = this.nodes[0] ?? null;
  }

  init(values) {
    LinkedListVisualizer.nextId = 0;
    const used = new Set();
    this.nodes = values.map((v) => {
      let addr;
      do {
        addr = LinkedListVisualizer.generateAddress();
      } while (used.has(addr));
      used.add(addr);
      return new LinkedListNode(v, addr, LinkedListVisualizer.nextId++);
    });
    this._linkNodes();
    this.render();
    this.setStatus(`Linked list created with ${this.nodes.length} nodes. Click any node to perform operations.`);
  }

  _nextPointerLabel(node) {
    return node.next ? node.next.address : 'null';
  }

  // ===== Trace Helper Methods =====

  /**
   * Create a new node for tracing (not yet added to the list).
   */
  _createTracedNode(value) {
    const node = new LinkedListNode(value, this._uniqueAddress(), LinkedListVisualizer.nextId++);
    return node;
  }

  /**
   * Render the main list with a floating (unlinked) node shown above.
   */
  _renderWithFloatingNode(node, displayValue, nextLabel, labels) {
    this._floatingNode = { node, displayValue, nextLabel, labels: labels || [] };
    this.render();
  }

  /**
   * Clear the floating node display.
   */
  _clearFloatingNode() {
    this._floatingNode = null;
  }

  /**
   * Add pointer labels (temp, newNode, head, current, prev) to specific nodes.
   * @param {Array<{nodeIndex: number, labels: string[]}>} labelDefs
   */
  _addPointerLabels(labelDefs) {
    this._pointerLabels = labelDefs;
    // Re-render labels without full re-render
    this._renderPointerLabelsDOM();
  }

  /**
   * Clear all pointer labels.
   */
  _clearPointerLabels() {
    this._pointerLabels = [];
    this.container.querySelectorAll('.ll-pointer-label').forEach(el => el.remove());
  }

  /**
   * Render pointer label elements onto existing nodes.
   */
  _renderPointerLabelsDOM() {
    // Remove existing labels
    this.container.querySelectorAll('.ll-pointer-label').forEach(el => el.remove());

    this._pointerLabels.forEach(({ nodeIndex, labels }) => {
      const wrapper = this.container.querySelector(`.ll-node-wrapper[data-index="${nodeIndex}"]`);
      if (wrapper) {
        const labelContainer = document.createElement('div');
        labelContainer.className = 'll-pointer-label';
        labels.forEach(label => {
          const span = document.createElement('span');
          span.className = 'll-ptr-tag';
          span.textContent = label;
          labelContainer.appendChild(span);
        });
        wrapper.appendChild(labelContainer);
      }
    });
  }

  /**
   * Show a decision indicator (✓ or ✗) for condition checks.
   */
  _showDecision(result, expression) {
    this._decisionState = { result, expression };
    // Render the decision badge
    let badge = this.container.querySelector('.ll-decision-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'll-decision-badge';
      this.container.appendChild(badge);
    }
    badge.className = `ll-decision-badge ${result ? 'decision-true' : 'decision-false'}`;
    badge.innerHTML = `<span class="decision-icon">${result ? '✓' : '✗'}</span> <span class="decision-expr">${expression}</span>`;
  }

  /**
   * Clear the decision indicator.
   */
  _clearDecision() {
    this._decisionState = null;
    const badge = this.container.querySelector('.ll-decision-badge');
    if (badge) badge.remove();
  }

  // ===== Core Render =====

  render() {
    const headTarget = this.head ? this.head.address : 'null';

    let html = '';

    // Floating node (newly allocated, not yet linked)
    if (this._floatingNode) {
      const { node, displayValue, nextLabel, labels } = this._floatingNode;
      html += `
        <div class="ll-floating-node">
          <div class="ll-floating-label">Newly Allocated</div>
          <div class="ll-node-wrapper" data-floating="true">
            <div class="ll-node-group">
              <div class="ll-node inserting" data-floating="true">
                <div class="ll-data">${displayValue}</div>
                <div class="ll-pointer" title="Points to next node">${nextLabel}</div>
              </div>
            </div>
            <span class="ll-address">@ ${node.address}</span>
            ${labels.length > 0 ? `<div class="ll-pointer-label">${labels.map(l => `<span class="ll-ptr-tag">${l}</span>`).join('')}</div>` : ''}
          </div>
        </div>
      `;
    }

    html += `
      <div class="linkedlist-viz">
        <div class="ll-nodes-row">
          <div class="ll-head-item">
            <span class="ll-head-label">HEAD</span>
            <span class="ll-head-target">${headTarget}</span>
            ${this.nodes.length ? '<span class="ll-arrow">→</span>' : ''}
          </div>
    `;

    this.nodes.forEach((node, i) => {
      const ptrLabel = this._nextPointerLabel(node);
      html += `
          <div class="ll-node-wrapper" data-index="${i}">
            <div class="ll-node-group">
              <div class="ll-node" data-index="${i}">
                <div class="ll-data">${node.value}</div>
                <div class="ll-pointer" title="Points to next node">${ptrLabel}</div>
              </div>
              ${i < this.nodes.length - 1 ? '<span class="ll-arrow">→</span>' : ''}
            </div>
            <span class="ll-address">@ ${node.address}</span>
          </div>
      `;
    });

    if (this.nodes.length) {
      html += '<span class="ll-arrow">→</span>';
    }
    html += `<span class="ll-null-node">null</span>`;
    html += '</div></div>';

    this.container.innerHTML = html;

    // Re-attach click handlers
    this.container.querySelectorAll('.ll-node:not([data-floating])').forEach((nodeEl) => {
      nodeEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onNodeClick) this.onNodeClick(parseInt(nodeEl.dataset.index, 10), nodeEl);
      });
    });

    // Re-render pointer labels if any
    if (this._pointerLabels.length > 0) {
      this._renderPointerLabelsDOM();
    }

    // Re-render decision badge if any
    if (this._decisionState) {
      this._showDecision(this._decisionState.result, this._decisionState.expression);
    }
  }

  highlightNode(index, className) {
    const node = this.container.querySelector(`.ll-node[data-index="${index}"]`);
    if (node) node.classList.add(className);
    return node;
  }

  clearHighlights(...classNames) {
    classNames.forEach((cls) => {
      this.container.querySelectorAll(`.${cls}`).forEach((el) => el.classList.remove(cls));
    });
  }

  // ===== Original Operations (preserved for backward compatibility) =====

  async insertAt(index, value, position) {
    const insertIdx = position === 'before' ? index : index + 1;
    const newNode = new LinkedListNode(value, this._uniqueAddress(), LinkedListVisualizer.nextId++);

    this.setStatus(`Creating new node ${newNode.address} with value ${value}…`);
    await this.anim.wait();

    if (insertIdx === 0) {
      this.nodes.unshift(newNode);
    } else if (insertIdx >= this.nodes.length) {
      this.nodes.push(newNode);
    } else {
      this.nodes.splice(insertIdx, 0, newNode);
    }

    this._linkNodes();
    this.render();
    this.highlightNode(insertIdx, 'inserting');
    await this.anim.wait();

    const prevVal = insertIdx > 0 ? this.nodes[insertIdx - 1].value : null;
    const nextVal = insertIdx < this.nodes.length - 1 ? this.nodes[insertIdx + 1].value : null;

    this.clearHighlights('inserting');
    if (prevVal != null && nextVal != null) {
      this.setStatus(
        `Node at ${this.nodes[insertIdx - 1].address} now points to ${newNode.address}. New node points to ${this.nodes[insertIdx + 1].address}.`
      );
    } else if (insertIdx === 0) {
      this.setStatus(`HEAD now points to ${newNode.address}.`);
    } else {
      this.setStatus(`Tail node now points to null.`);
    }
    this.render();
  }

  async deleteAt(index) {
    if (index < 0 || index >= this.nodes.length) return;

    const removed = this.nodes[index];
    const prev = index > 0 ? this.nodes[index - 1] : null;
    const next = index < this.nodes.length - 1 ? this.nodes[index + 1] : null;

    this.setStatus(`Removing node at ${removed.address}…`);
    this.highlightNode(index, 'deleting');
    await this.anim.wait(this.anim.delay * 0.8);

    this.nodes.splice(index, 1);
    this._linkNodes();
    this.render();
    await this.anim.wait();

    this.clearHighlights('deleting');
    if (prev && next) {
      this.setStatus(`Node at ${prev.address} now points to ${next.address}, bypassing deleted node.`);
    } else if (prev) {
      this.setStatus(`Node at ${prev.address} now points to null.`);
    } else if (this.head) {
      this.setStatus(`HEAD now points to ${this.head.address}.`);
    } else {
      this.setStatus('List is empty. HEAD points to null.');
    }
    this.render();
  }

  async updateAt(index, value) {
    const oldVal = this.nodes[index].value;
    this.setStatus(`Updating node at ${this.nodes[index].address} from ${oldVal} to ${value}…`);
    this.highlightNode(index, 'visiting');
    await this.anim.wait();

    this.nodes[index].value = value;
    this.render();
    this.clearHighlights('visiting');
    this.setStatus(`Node ${index} updated to ${value}.`);
  }

  highlightAt(index) {
    this.clearHighlights('highlighted', 'visiting', 'comparing', 'found');
    this.highlightNode(index, 'highlighted');
    const node = this.nodes[index];
    this.setStatus(`Node ${index} — Data: ${node.value}, Address: ${node.address}`);
  }

  async traverse() {
    this.clearHighlights('visiting', 'comparing', 'found', 'highlighted');

    for (let i = 0; i < this.nodes.length; i++) {
      if (this.anim._abort) break;
      this.clearHighlights('visiting');
      this.highlightNode(i, 'visiting');
      this.setStatus(`Visiting node at ${this.nodes[i].address} (value: ${this.nodes[i].value})`);
      await this.anim.wait();
    }

    this.clearHighlights('visiting');
    this.setStatus('Traversal complete — reached null.');
  }

  async search(target) {
    this.clearHighlights('visiting', 'comparing', 'found', 'highlighted');

    for (let i = 0; i < this.nodes.length; i++) {
      if (this.anim._abort) break;
      this.clearHighlights('comparing');
      this.highlightNode(i, 'comparing');
      this.setStatus(`Comparing ${target} with ${this.nodes[i].value}`);
      await this.anim.wait();

      if (this.nodes[i].value == target) {
        this.clearHighlights('comparing');
        this.highlightNode(i, 'found');
        this.setStatus(`Found at node ${i} (${this.nodes[i].address}).`);
        return;
      }
    }

    this.clearHighlights('comparing');
    this.setStatus(`${target} not found in the linked list.`);
  }

  // ===== Traced Operations (step-by-step with code highlighting) =====

  /**
   * Insert with step-by-step code tracing.
   * Uses LinkedListTraceSteps to generate steps, then executes via CodeTraceEngine.
   */
  async insertAtTraced(index, value, position, traceEngine, language) {
    const lang = language || 'c';
    const insertIdx = position === 'before' ? index : index + 1;
    const isAtEnd = insertIdx >= this.nodes.length;

    let traceData;
    if (isAtEnd && (insertIdx === 0 || insertIdx === this.nodes.length)) {
      // Use the simple insert (end-of-list) for cleaner code
      const isFirst = this.nodes.length === 0;
      traceData = LinkedListTraceSteps[lang].insert(this, value, isFirst);
    } else {
      traceData = LinkedListTraceSteps[lang].insertAt(this, index, value, position);
    }

    traceEngine.loadSteps(traceData.codeLines, traceData.steps);
    await traceEngine.execute();
  }

  /**
   * Delete with step-by-step code tracing.
   */
  async deleteAtTraced(index, traceEngine, language) {
    const lang = language || 'c';
    const traceData = LinkedListTraceSteps[lang].delete(this, index);
    traceEngine.loadSteps(traceData.codeLines, traceData.steps);
    await traceEngine.execute();
  }

  /**
   * Traverse with step-by-step code tracing.
   */
  async traverseTraced(traceEngine, language) {
    const lang = language || 'c';
    this.clearHighlights('visiting', 'comparing', 'found', 'highlighted');
    const traceData = LinkedListTraceSteps[lang].traverse(this);
    traceEngine.loadSteps(traceData.codeLines, traceData.steps);
    await traceEngine.execute();
  }

  /**
   * Search with step-by-step code tracing.
   */
  async searchTraced(target, traceEngine, language) {
    const lang = language || 'c';
    this.clearHighlights('visiting', 'comparing', 'found', 'highlighted');
    const traceData = LinkedListTraceSteps[lang].search(this, target);
    traceEngine.loadSteps(traceData.codeLines, traceData.steps);
    await traceEngine.execute();
  }

  /**
   * Update with step-by-step code tracing.
   */
  async updateAtTraced(index, value, traceEngine, language) {
    const lang = language || 'c';
    const traceData = LinkedListTraceSteps[lang].update(this, index, value);
    traceEngine.loadSteps(traceData.codeLines, traceData.steps);
    await traceEngine.execute();
  }

  /**
   * Reverse with step-by-step code tracing (new operation!).
   */
  async reverseTraced(traceEngine, language) {
    const lang = language || 'c';
    this.clearHighlights('visiting', 'comparing', 'found', 'highlighted');
    const traceData = LinkedListTraceSteps[lang].reverse(this);
    traceEngine.loadSteps(traceData.codeLines, traceData.steps);
    await traceEngine.execute();
  }

  /**
   * Reverse without tracing (simple version).
   */
  async reverse() {
    this.clearHighlights('visiting', 'comparing', 'found', 'highlighted');

    for (let i = 0; i < this.nodes.length; i++) {
      if (this.anim._abort) break;
      this.clearHighlights('visiting');
      this.highlightNode(i, 'visiting');
      this.setStatus(`Processing node ${i} for reversal…`);
      await this.anim.wait();
    }

    this.nodes.reverse();
    this._linkNodes();
    this.render();
    this.clearHighlights('visiting');
    this.setStatus('Linked list reversed successfully.');
  }

  reset(values) {
    this.anim.abort();
    this._clearPointerLabels();
    this._clearDecision();
    this._clearFloatingNode();
    this._traceNewNode = null;
    this.init(values);
  }
}
