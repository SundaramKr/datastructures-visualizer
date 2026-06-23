// Educational Slides Content
const SlidesContent = {
  array: [
    {
      title: "What is an Array?",
      content: `
        <div class="slide-section">
          <h3 class="slide-section-title">Definition</h3>
          <p class="slide-text">An array is a collection of elements of the same data type stored in contiguous memory locations. It is one of the simplest and most widely used data structures in programming.</p>
        </div>
        <div class="slide-section">
          <h3 class="slide-section-title">Key Characteristics</h3>
          <ul class="slide-list">
            <li>Fixed size (declared at creation)</li>
            <li>Elements are stored sequentially in memory</li>
            <li>Each element can be accessed using an index</li>
            <li>All elements must be of the same data type</li>
            <li>Indexing typically starts from 0</li>
          </ul>
        </div>
        <div class="slide-section">
          <h3 class="slide-section-title">Simple Example</h3>
          <div class="slide-code-block">int numbers[5] = {10, 20, 30, 40, 50};</div>
          <p class="slide-text">This creates an array of 5 integers with the values shown above.</p>
        </div>
      `
    },
    {
      title: "What are Arrays Used For?",
      content: `
        <div class="slide-section">
          <h3 class="slide-section-title">Common Use Cases</h3>
          <ul class="slide-list">
            <li>Storing lists of similar items (student grades, product prices)</li>
            <li>Implementing other data structures (stacks, queues, heaps)</li>
            <li>Matrix operations and mathematical computations</li>
            <li>Buffer storage in I/O operations</li>
            <li>Lookup tables and caching</li>
            <li>Image processing (pixel arrays)</li>
          </ul>
        </div>
        <div class="slide-section">
          <h3 class="slide-section-title">Real-World Examples</h3>
          <ul class="slide-list">
            <li>A calendar storing days of the month</li>
            <li>A music playlist with song titles</li>
            <li>A spreadsheet row or column</li>
            <li>RGB values for image pixels</li>
          </ul>
        </div>
      `
    },
    {
      title: "Advantages of Arrays",
      content: `
        <div class="slide-section">
          <h3 class="slide-section-title">Key Benefits</h3>
          <ul class="slide-list advantages">
            <li><strong>Fast Access:</strong> O(1) time complexity for accessing elements by index</li>
            <li><strong>Memory Efficient:</strong> No extra memory for pointers or references</li>
            <li><strong>Cache Friendly:</strong> Contiguous memory improves CPU cache performance</li>
            <li><strong>Simple Implementation:</strong> Easy to understand and use</li>
            <li><strong>Multi-dimensional:</strong> Can represent matrices and multi-dimensional data</li>
            <li><strong>Random Access:</strong> Can access any element directly using its index</li>
          </ul>
        </div>
        <div class="slide-section">
          <h3 class="slide-section-title">Performance</h3>
          <p class="slide-text">Arrays provide the fastest possible access time for indexed elements, making them ideal for applications where quick lookups are critical.</p>
        </div>
      `
    },
    {
      title: "Disadvantages of Arrays",
      content: `
        <div class="slide-section">
          <h3 class="slide-section-title">Limitations</h3>
          <ul class="slide-list disadvantages">
            <li><strong>Fixed Size:</strong> Cannot grow or shrink dynamically once created</li>
            <li><strong>Wasted Memory:</strong> If allocated size is larger than needed</li>
            <li><strong>Costly Insertions/Deletions:</strong> O(n) time complexity due to shifting</li>
            <li><strong>Homogeneous Data:</strong> All elements must be the same type</li>
            <li><strong>No Built-in Methods:</strong> Basic operations must be implemented manually</li>
          </ul>
        </div>
        <div class="slide-section">
          <h3 class="slide-section-title">When to Avoid</h3>
          <p class="slide-text">Arrays are not suitable when you need frequent insertions/deletions, when the size is unknown in advance, or when you need to store different data types together.</p>
        </div>
      `
    },
    {
      title: "How Arrays are Stored in Memory",
      content: `
        <div class="slide-section">
          <h3 class="slide-section-title">Contiguous Memory Layout</h3>
          <p class="slide-text">Array elements are stored in consecutive memory addresses. Each element occupies the same amount of memory (based on data type).</p>
        </div>
        <div class="slide-section">
          <h3 class="slide-section-title">Memory Diagram</h3>
          <div class="slide-memory-diagram">
            <div class="memory-cell">
              <span class="memory-address">0x1000</span>
              <span class="memory-value">10</span>
            </div>
            <span class="memory-arrow">→</span>
            <div class="memory-cell">
              <span class="memory-address">0x1004</span>
              <span class="memory-value">20</span>
            </div>
            <span class="memory-arrow">→</span>
            <div class="memory-cell">
              <span class="memory-address">0x1008</span>
              <span class="memory-value">30</span>
            </div>
            <span class="memory-arrow">→</span>
            <div class="memory-cell">
              <span class="memory-address">0x100C</span>
              <span class="memory-value">40</span>
            </div>
            <span class="memory-arrow">→</span>
            <div class="memory-cell">
              <span class="memory-address">0x1010</span>
              <span class="memory-value">50</span>
            </div>
          </div>
          <p class="slide-text">Each integer (4 bytes) is stored at consecutive addresses. The address of any element can be calculated: base_address + (index × element_size)</p>
        </div>
        <div class="slide-section">
          <h3 class="slide-section-title">Index Calculation</h3>
          <div class="slide-code-block">address = base_address + (index * sizeof(type))</div>
          <p class="slide-text">This formula allows O(1) access to any element.</p>
        </div>
      `
    }
  ],
  linkedlist: [
    {
      title: "What is a Linked List?",
      content: `
        <div class="slide-section">
          <h3 class="slide-section-title">Definition</h3>
          <p class="slide-text">A linked list is a linear data structure where elements are stored in nodes. Each node contains data and a reference (pointer) to the next node in the sequence. Unlike arrays, elements are not stored in contiguous memory locations.</p>
        </div>
        <div class="slide-section">
          <h3 class="slide-section-title">Key Characteristics</h3>
          <ul class="slide-list">
            <li>Dynamic size (can grow or shrink as needed)</li>
            <li>Elements stored in non-contiguous memory locations</li>
            <li>Each node has data and a pointer to the next node</li>
            <li>Efficient insertion and deletion operations</li>
            <li>Sequential access only (no random access)</li>
          </ul>
        </div>
        <div class="slide-section">
          <h3 class="slide-section-title">Node Structure</h3>
          <div class="slide-code-block">struct Node {
    int data;
    struct Node* next;
};</div>
        </div>
      `
    },
    {
      title: "What are Linked Lists Used For?",
      content: `
        <div class="slide-section">
          <h3 class="slide-section-title">Common Use Cases</h3>
          <ul class="slide-list">
            <li>Implementing stacks, queues, and other abstract data types</li>
            <li>Dynamic memory allocation when size is unknown</li>
            <li>Undo/redo functionality in applications</li>
            <li>Music playlists with next/previous navigation</li>
            <li>Browser history (back/forward buttons)</li>
            <li>Polynomial representation and arithmetic</li>
          </ul>
        </div>
        <div class="slide-section">
          <h3 class="slide-section-title">Real-World Examples</h3>
          <ul class="slide-list">
            <li>A train with connected cars</li>
            <li>A treasure hunt with clues leading to the next location</li>
            <li>Navigation systems with waypoints</li>
            <li>Blockchain (each block points to the previous)</li>
          </ul>
        </div>
      `
    },
    {
      title: "Advantages of Linked Lists",
      content: `
        <div class="slide-section">
          <h3 class="slide-section-title">Key Benefits</h3>
          <ul class="slide-list advantages">
            <li><strong>Dynamic Size:</strong> Can grow or shrink at runtime</li>
            <li><strong>Efficient Insertions/Deletions:</strong> O(1) time if position is known</li>
            <li><strong>No Memory Wastage:</strong> Only allocates memory as needed</li>
            <li><strong>Flexible:</strong> Easy to implement various structures (circular, doubly)</li>
            <li><strong>No Size Limit:</strong> Limited only by available memory</li>
          </ul>
        </div>
        <div class="slide-section">
          <h3 class="slide-section-title">Performance</h3>
          <p class="slide-text">Linked lists excel in scenarios where frequent insertions and deletions are required, especially at the beginning or middle of the collection.</p>
        </div>
      `
    },
    {
      title: "Disadvantages of Linked Lists",
      content: `
        <div class="slide-section">
          <h3 class="slide-section-title">Limitations</h3>
          <ul class="slide-list disadvantages">
            <li><strong>Slow Access:</strong> O(n) time to access elements (no random access)</li>
            <li><strong>Extra Memory:</strong> Each node requires additional memory for pointers</li>
            <li><strong>Not Cache Friendly:</strong> Non-contiguous memory reduces cache efficiency</li>
            <li><strong>Reverse Traversal:</strong> Difficult in singly linked lists</li>
            <li><strong>Pointer Overhead:</strong> More complex to implement and debug</li>
          </ul>
        </div>
        <div class="slide-section">
          <h3 class="slide-section-title">When to Avoid</h3>
          <p class="slide-text">Linked lists are not suitable when you need fast random access, when memory is constrained, or when you need to frequently access elements by index.</p>
        </div>
      `
    },
    {
      title: "How Linked Lists are Stored in Memory",
      content: `
        <div class="slide-section">
          <h3 class="slide-section-title">Non-Contiguous Memory Layout</h3>
          <p class="slide-text">Linked list nodes can be scattered anywhere in memory. Each node contains the data and a pointer (memory address) to the next node.</p>
        </div>
        <div class="slide-section">
          <h3 class="slide-section-title">Memory Diagram</h3>
          <div class="slide-memory-diagram">
            <div style="display: inline-flex;">
              <strong>HEAD →</strong>
            </div>
            <div class="memory-cell">
              <span class="memory-address">0x1A4F</span>
              <span class="memory-value">Data: 10</span>
              <span class="memory-address">Next: 0x2B8C</span>
            </div>
            <span class="memory-arrow">→</span>
            <div class="memory-cell">
              <span class="memory-address">0x2B8C</span>
              <span class="memory-value">Data: 20</span>
              <span class="memory-address">Next: 0x3D1E</span>
            </div>
            <span class="memory-arrow">→</span>
            <div class="memory-cell">
              <span class="memory-address">0x3D1E</span>
              <span class="memory-value">Data: 30</span>
              <span class="memory-address">Next: NULL</span>
            </div>
            <span class="memory-arrow">→</span>
            <div style="display: inline-flex; color: var(--gray-500);"><strong>NULL</strong></div>
          </div>
          <p class="slide-text">Nodes can be at any memory address. The "next" pointer links them together. The last node points to NULL, indicating the end of the list.</p>
        </div>
        <div class="slide-section">
          <h3 class="slide-section-title">Memory Overhead</h3>
          <p class="slide-text">Each node requires extra memory for the pointer (typically 4-8 bytes depending on system). For a 32-bit system, this adds 4 bytes per node.</p>
        </div>
      `
    }
  ]
};
