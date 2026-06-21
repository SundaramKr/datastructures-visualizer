/**
 * Data Structures Visualizer
 */

// C Code Templates
const CCodeTemplates = {
  array: {
    create: (values, capacity) => `// Create array with ${values.length} elements (capacity: ${capacity})
int main() {
    int capacity = ${capacity};
    int size = ${values.length};
    int arr[${capacity}] = {${values.join(', ')}};
    
    // Array is now ready for operations
    return 0;
}`,
    insert: (index, value, position) => `// Insert ${value} at index ${position === 'before' ? index : index + 1}
void insertAt(int arr[], int *size, int capacity, int index, int value) {
    if (*size >= capacity) {
        printf("Array is full\\n");
        return;
    }
    
    // Shift elements to the right
    for (int i = *size; i > index; i--) {
        arr[i] = arr[i - 1];
    }
    
    // Insert the new element
    arr[index] = value;
    (*size)++;
}`,
    delete: (index) => `// Delete element at index ${index}
void deleteAt(int arr[], int *size, int index) {
    if (index < 0 || index >= *size) {
        printf("Invalid index\\n");
        return;
    }
    
    // Shift elements to the left
    for (int i = index; i < *size - 1; i++) {
        arr[i] = arr[i + 1];
    }
    
    (*size)--;
}`,
    update: (index, value) => `// Update element at index ${index} to ${value}
void updateAt(int arr[], int size, int index, int value) {
    if (index < 0 || index >= size) {
        printf("Invalid index\\n");
        return;
    }
    
    arr[index] = value;
}`,
    traverse: () => `// Traverse the array
void traverse(int arr[], int size) {
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
}`,
    search: (target) => `// Search for ${target} in the array
int search(int arr[], int size, int target) {
    for (int i = 0; i < size; i++) {
        if (arr[i] == target) {
            return i;  // Found at index i
        }
    }
    return -1;  // Not found
}`,
    highlight: (index) => `// Access element at index ${index}
int getElement(int arr[], int size, int index) {
    if (index < 0 || index >= size) {
        printf("Invalid index\\n");
        return -1;
    }
    return arr[index];
}`
  },
  linkedlist: {
    create: (values) => `// Create linked list with ${values.length} nodes
typedef struct Node {
    int data;
    struct Node* next;
} Node;

Node* createLinkedList(int values[], int size) {
    if (size == 0) return NULL;
    
    Node* head = (Node*)malloc(sizeof(Node));
    head->data = values[0];
    head->next = NULL;
    
    Node* current = head;
    for (int i = 1; i < size; i++) {
        current->next = (Node*)malloc(sizeof(Node));
        current = current->next;
        current->data = values[i];
        current->next = NULL;
    }
    
    return head;
}

int main() {
    int values[] = {${values.join(', ')}};
    int size = ${values.length};
    Node* head = createLinkedList(values, size);
    
    // Linked list is now ready for operations
    return 0;
}`,
    insert: (index, value, position) => `// Insert ${value} ${position === 'before' ? 'before' : 'after'} node ${index}
typedef struct Node {
    int data;
    struct Node* next;
} Node;

void insertAt(Node** head, int index, int value, int position) {
    Node* newNode = (Node*)malloc(sizeof(Node));
    newNode->data = value;
    
    if (index == 0 && position == 'before') {
        newNode->next = *head;
        *head = newNode;
        return;
    }
    
    Node* current = *head;
    for (int i = 0; i < index && current->next; i++) {
        current = current->next;
    }
    
    newNode->next = current->next;
    current->next = newNode;
}`,
    delete: (index) => `// Delete node at index ${index}
void deleteAt(Node** head, int index) {
    if (*head == NULL) return;
    
    Node* temp = *head;
    
    if (index == 0) {
        *head = temp->next;
        free(temp);
        return;
    }
    
    for (int i = 0; temp != NULL && i < index - 1; i++) {
        temp = temp->next;
    }
    
    if (temp == NULL || temp->next == NULL) return;
    
    Node* next = temp->next->next;
    free(temp->next);
    temp->next = next;
}`,
    update: (index, value) => `// Update node at index ${index} to ${value}
void updateAt(Node* head, int index, int value) {
    Node* current = head;
    for (int i = 0; i < index && current != NULL; i++) {
        current = current->next;
    }
    
    if (current != NULL) {
        current->data = value;
    }
}`,
    traverse: () => `// Traverse the linked list
void traverse(Node* head) {
    Node* current = head;
    while (current != NULL) {
        printf("%d ", current->data);
        current = current->next;
    }
    printf("\\n");
}`,
    search: (target) => `// Search for ${target} in the linked list
int search(Node* head, int target) {
    Node* current = head;
    int index = 0;
    
    while (current != NULL) {
        if (current->data == target) {
            return index;
        }
        current = current->next;
        index++;
    }
    
    return -1;  // Not found
}`,
    highlight: (index) => `// Access node at index ${index}
Node* getNode(Node* head, int index) {
    Node* current = head;
    for (int i = 0; i < index && current != NULL; i++) {
        current = current->next;
    }
    return current;
}`
  }
};

class AnimationController {
  constructor() {
    this.speeds = { slow: 900, normal: 450, fast: 180 };
    this.speed = 'normal';
    this._abort = false;
  }

  get delay() {
    return this.speeds[this.speed] ?? this.speeds.normal;
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  abort() {
    this._abort = true;
  }

  resetAbort() {
    this._abort = false;
  }

  async wait(ms) {
    if (this._abort) return;
    await new Promise((resolve) => setTimeout(resolve, ms ?? this.delay));
  }
}

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

class ArrayVisualizer extends BaseVisualizer {
  constructor(container, anim, statusEl, infoStrip) {
    super(container, anim, statusEl, infoStrip);
    this.capacity = 10;
    this.data = [];
    this.searchDefault = '30';
    this.onCellClick = null;
  }

  init(values, capacity) {
    this.capacity = Math.max(1, capacity ?? values.length);
    this.data = values.slice(0, this.capacity);
    this.render();
    this.setStatus(`Array created with ${this.data.length} elements. Click any cell to perform operations.`);
  }

  render() {
    let html = `
      <div class="array-viz">
        <div class="array-meta">
          <span class="array-meta-item">Size: ${this.data.length}</span>
          <span class="array-meta-item">Capacity: ${this.capacity}</span>
        </div>
        <div class="array-row">
    `;

    for (let i = 0; i < this.capacity; i++) {
      const filled = i < this.data.length;
      html += `
        <div class="array-cell-wrapper" data-index="${i}">
          <div class="array-cell ${filled ? 'filled' : 'empty'}" data-index="${i}">${filled ? this.data[i] : ''}</div>
          <span class="array-index">${i}</span>
        </div>
      `;
    }

    html += '</div></div>';
    this.container.innerHTML = html;

    this.container.querySelectorAll('.array-cell.filled').forEach((cell) => {
      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onCellClick) this.onCellClick(parseInt(cell.dataset.index, 10), cell);
      });
    });
  }

  highlightCell(index, className) {
    const cell = this.container.querySelector(`.array-cell[data-index="${index}"]`);
    if (cell) cell.classList.add(className);
    return cell;
  }

  clearHighlights(...classNames) {
    classNames.forEach((cls) => {
      this.container.querySelectorAll(`.${cls}`).forEach((el) => el.classList.remove(cls));
    });
    this.container.querySelectorAll('.active-index').forEach((el) => el.classList.remove('active-index'));
    this.container.querySelectorAll('.array-pointer').forEach((el) => el.remove());
  }

  setActiveIndex(index) {
    this.container.querySelectorAll('.array-index').forEach((el, i) => {
      el.classList.toggle('active-index', i === index);
    });
    this.container.querySelectorAll('.array-pointer').forEach((el) => el.remove());
    if (index != null) {
      const wrapper = this.container.querySelector(`.array-cell-wrapper[data-index="${index}"]`);
      if (wrapper) {
        const ptr = document.createElement('div');
        ptr.className = 'array-pointer';
        ptr.textContent = '▲';
        wrapper.appendChild(ptr);
      }
    }
  }

  async insertAt(index, value, position) {
    if (this.data.length >= this.capacity) {
      this.setStatus('Array is full. Cannot insert more elements.');
      return;
    }

    const insertIdx = position === 'before' ? index : index + 1;
    this.setStatus(`Inserting ${value} at index ${insertIdx}…`);

    for (let i = this.data.length - 1; i >= insertIdx; i--) {
      this.highlightCell(i, 'shifting-right');
      await this.anim.wait(this.anim.delay * 0.35);
    }

    this.data.splice(insertIdx, 0, value);
    this.render();
    this.highlightCell(insertIdx, 'inserting');
    await this.anim.wait();

    this.clearHighlights('shifting-right', 'inserting');
    this.setStatus(
      insertIdx < this.data.length - 1
        ? `Elements from index ${insertIdx + 1} onward shift one position to the right.`
        : `Element inserted at index ${insertIdx}.`
    );
    this.render();
  }

  async deleteAt(index) {
    if (index < 0 || index >= this.data.length) return;

    this.setStatus(`Deleting element at index ${index}…`);
    this.highlightCell(index, 'deleting');
    await this.anim.wait();

    this.data.splice(index, 1);
    this.render();

    for (let i = index; i < this.data.length; i++) {
      this.highlightCell(i, 'shifting-left');
      await this.anim.wait(this.anim.delay * 0.3);
    }

    this.clearHighlights('shifting-left');
    this.setStatus('Deletion requires shifting subsequent elements left.');
    this.render();
  }

  async updateAt(index, value) {
    const oldVal = this.data[index];
    this.setStatus(`Updating index ${index} from ${oldVal} to ${value}…`);
    this.highlightCell(index, 'visiting');
    await this.anim.wait();

    this.data[index] = value;
    this.render();
    this.clearHighlights('visiting');
    this.setStatus(`Index ${index} updated to ${value}.`);
  }

  highlightAt(index) {
    this.clearHighlights('highlighted', 'visiting', 'comparing', 'found');
    this.highlightCell(index, 'highlighted');
    this.setActiveIndex(index);
    this.setInfo([
      { label: 'Index', value: index, highlight: true },
      { label: 'Value', value: this.data[index], highlight: true },
    ]);
    this.setStatus(`Index: ${index}, Value: ${this.data[index]}`);
  }

  async traverse() {
    this.clearHighlights('visiting', 'comparing', 'found', 'highlighted');
    this.clearInfo();

    for (let i = 0; i < this.data.length; i++) {
      if (this.anim._abort) break;
      this.clearHighlights('visiting');
      this.highlightCell(i, 'visiting');
      this.setActiveIndex(i);
      this.setStatus(`Currently visiting index ${i}.`);
      await this.anim.wait();
    }

    this.clearHighlights('visiting');
    this.setStatus('Traversal complete.');
  }

  async search(target) {
    this.clearHighlights('visiting', 'comparing', 'found', 'highlighted');
    this.clearInfo();

    for (let i = 0; i < this.data.length; i++) {
      if (this.anim._abort) break;
      this.clearHighlights('comparing');
      this.highlightCell(i, 'comparing');
      this.setActiveIndex(i);
      this.setStatus(`Comparing ${target} with ${this.data[i]}`);
      await this.anim.wait();

      if (this.data[i] == target) {
        this.clearHighlights('comparing');
        this.highlightCell(i, 'found');
        this.setStatus(`Found at index ${i}.`);
        this.setInfo([
          { label: 'Found at Index', value: i, highlight: true },
          { label: 'Value', value: target, highlight: true },
        ]);
        return;
      }
    }

    this.clearHighlights('comparing');
    this.setStatus(`${target} not found in the array.`);
  }

  reset(values) {
    this.anim.abort();
    this.init(values);
    this.clearInfo();
  }
}

class LinkedListNode {
  constructor(value, address) {
    this.value = value;
    this.address = address;
    this.next = null;
    this.id = LinkedListVisualizer.nextId++;
  }
}

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
      return new LinkedListNode(v, addr);
    });
    this._linkNodes();
    this.render();
    this.setStatus(`Linked list created with ${this.nodes.length} nodes. Click any node to perform operations.`);
  }

  _nextPointerLabel(node) {
    return node.next ? node.next.address : 'null';
  }

  render() {
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
    const insertIdx = position === 'before' ? index : index + 1;
    const newNode = new LinkedListNode(value, this._uniqueAddress());

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

class App {
  constructor() {
    this.anim = new AnimationController();
    this.currentModule = null;
    this.visualizer = null;
    this.contextTarget = null;
    this._operationCallback = null;

    this.screens = {
      home: document.getElementById('screen-home'),
      modules: document.getElementById('screen-modules'),
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
    };

    this.initialValues = [];
    this._bindEvents();
  }

  _bindEvents() {
    document.getElementById('btn-enter').addEventListener('click', () => this.showScreen('modules'));
    document.getElementById('btn-back-modules').addEventListener('click', () => this.showScreen('home'));
    document.getElementById('btn-back-viz').addEventListener('click', () => {
      this.anim.abort();
      this.hideContextMenu();
      this.showScreen('modules');
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
        this.elements.codePanelContent.textContent = '// Click on an operation to see the C code';
      }
    });

    this.elements.codePanelClose.addEventListener('click', () => {
      this.elements.codePanelContent.textContent = '// Click on an operation to see the C code';
    });
  }

  showScreen(name) {
    Object.values(this.screens).forEach((s) => s.classList.remove('active'));
    this.screens[name].classList.add('active');
  }

  updateCodePanel(operation, value = null, index = null, position = null, values = null, capacity = null) {
    if (!this.currentModule) return;

    const templates = CCodeTemplates[this.currentModule];
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

    if (module === 'array') {
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

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.ModuleRegistry = ModuleRegistry;
});
