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
    this.clearInfo();
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
    this.clearInfo();
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
    this.clearInfo();
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
    this.clearInfo();
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
    this.clearInfo();
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
