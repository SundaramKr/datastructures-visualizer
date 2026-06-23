class LinkedListVisualizer extends BaseVisualizer {
  static nextId = 0;

  static generateAddress() {
    const hex = Math.floor(Math.random() * 0xFFF + 0x100)
      .toString(16)
      .toUpperCase()
      .padStart(3, '0');
    return `0x${hex}`;
  }

  constructor(container, anim, statusEl, infoStrip) {
    super(container, anim, statusEl, infoStrip);
    this.head = null;
    this.nodes = [];
    this.searchDefault = '40';
    this.onNodeClick = null;
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

  render() {
    this.clearInfo();
    const headTarget = this.head ? this.head.address : 'null';

    let html = `
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

    this.container.querySelectorAll('.ll-node').forEach((nodeEl) => {
      nodeEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onNodeClick) this.onNodeClick(parseInt(nodeEl.dataset.index, 10), nodeEl);
      });
    });
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

  async insertAt(index, value, position) {
    this.clearInfo();
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
    this.clearInfo();
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
    this.clearInfo();
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
    this.clearInfo();
    this.highlightNode(index, 'highlighted');
    const node = this.nodes[index];
    this.setInfo([
      { label: 'Data', value: node.value, highlight: true },
      { label: 'Address', value: node.address, highlight: true },
      { label: 'Points to', value: this._nextPointerLabel(node), highlight: false },
    ]);
    this.setStatus(`Node ${index} — Data: ${node.value}, Address: ${node.address}`);
  }

  async traverse() {
    this.clearHighlights('visiting', 'comparing', 'found', 'highlighted');
    this.clearInfo();

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
    this.clearInfo();

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
        this.setInfo([
          { label: 'Found at Node', value: i, highlight: true },
          { label: 'Value', value: target, highlight: true },
        ]);
        return;
      }
    }

    this.clearHighlights('comparing');
    this.setStatus(`${target} not found in the linked list.`);
  }

  reset(values) {
    this.anim.abort();
    this.init(values);
    this.clearInfo();
  }
}
