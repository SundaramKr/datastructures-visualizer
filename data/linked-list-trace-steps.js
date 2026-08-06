/**
 * Linked List Trace Steps
 * Defines C/Python code lines and step-by-step trace actions
 * for each linked list operation.
 *
 * Each factory function receives the visualizer instance and operation parameters,
 * and returns { codeLines: string[], steps: TraceStep[] }.
 *
 * TraceStep: { line: number|number[], description: string, action: async () => void }
 */
const LinkedListTraceSteps = {
  c: {
    /**
     * Insert operation — end-of-list insertion (matches user's example code).
     * Handles both first-node and subsequent-node cases.
     */
    insert: (viz, value, isFirstNode) => {
      const codeLines = [
        'void insert(int value) {',                              // 1
        '    struct Node *newNode, *temp;',                       // 2
        '    newNode = (struct Node *)malloc(sizeof(struct Node));', // 3
        '    newNode->data = value;',                            // 4
        '    newNode->next = NULL;',                             // 5
        '',                                                      // 6
        '    if (head == NULL) {',                               // 7
        '        head = newNode;',                               // 8
        '    } else {',                                          // 9
        '        temp = head;',                                  // 10
        '        while (temp->next != NULL) {',                  // 11
        '            temp = temp->next;',                        // 12
        '        }',                                             // 13
        '        temp->next = newNode;',                         // 14
        '    }',                                                 // 15
        '}',                                                     // 16
      ];

      const steps = [];

      // Step 1: Function entry
      steps.push({
        line: 1,
        description: `Calling insert(${value})`,
        action: () => viz.setStatus(`Calling insert(${value})…`),
      });

      // Step 2: Declare variables
      steps.push({
        line: 2,
        description: 'Declaring pointers newNode and temp',
        action: () => viz.setStatus('Declared struct Node *newNode, *temp;'),
      });

      // Step 3: malloc — create the new node visually
      steps.push({
        line: 3,
        description: 'Allocating memory for new node',
        action: () => {
          viz._traceNewNode = viz._createTracedNode(value);
          viz._renderWithFloatingNode(viz._traceNewNode, '?', 'NULL');
          viz.setStatus(`malloc() → allocated node at ${viz._traceNewNode.address}`);
        },
      });

      // Step 4: Assign data
      steps.push({
        line: 4,
        description: `Setting newNode->data = ${value}`,
        action: () => {
          viz._renderWithFloatingNode(viz._traceNewNode, value, 'NULL');
          viz.setStatus(`newNode->data = ${value}`);
        },
      });

      // Step 5: Set next = NULL
      steps.push({
        line: 5,
        description: 'Setting newNode->next = NULL',
        action: () => {
          viz._renderWithFloatingNode(viz._traceNewNode, value, 'NULL', ['newNode']);
          viz.setStatus('newNode->next = NULL');
        },
      });

      if (isFirstNode) {
        // Step: Check head == NULL (true)
        steps.push({
          line: 7,
          description: 'Checking if head == NULL → TRUE',
          action: () => {
            viz._showDecision(true, 'head == NULL');
            viz.setStatus('head == NULL → TRUE (list is empty)');
          },
        });

        // Step: head = newNode
        steps.push({
          line: 8,
          description: 'Setting head = newNode',
          action: () => {
            viz.nodes.push(viz._traceNewNode);
            viz._linkNodes();
            viz.head = viz.nodes[0];
            viz.render();
            viz._addPointerLabels([{ nodeIndex: 0, labels: ['head', 'newNode'] }]);
            viz.highlightNode(0, 'inserting');
            viz.setStatus(`head now points to ${viz._traceNewNode.address}`);
          },
        });
      } else {
        // Step: Check head == NULL (false)
        steps.push({
          line: 7,
          description: 'Checking if head == NULL → FALSE',
          action: () => {
            viz._showDecision(false, 'head == NULL');
            viz.setStatus('head == NULL → FALSE (list has nodes)');
          },
        });

        // Step: temp = head
        steps.push({
          line: 10,
          description: 'Setting temp = head',
          action: () => {
            viz.render();
            viz._addPointerLabels([{ nodeIndex: 0, labels: ['head', 'temp'] }]);
            viz.highlightNode(0, 'visiting');
            viz.setStatus(`temp = head (pointing to node at ${viz.nodes[0].address})`);
          },
        });

        // Steps: Traverse with temp = temp->next
        const lastIndex = viz.nodes.length - 1;
        for (let i = 0; i < lastIndex; i++) {
          const nodeI = i;
          // Check while condition
          steps.push({
            line: 11,
            description: `Checking temp->next != NULL at node ${nodeI}`,
            action: () => {
              viz.clearHighlights('visiting');
              viz.highlightNode(nodeI, 'visiting');
              viz._addPointerLabels([{ nodeIndex: nodeI, labels: ['temp'] }]);
              viz._showDecision(true, 'temp->next != NULL');
              viz.setStatus(`temp->next != NULL → TRUE (next: ${viz.nodes[nodeI].next ? viz.nodes[nodeI].next.address : 'NULL'})`);
            },
          });

          // Move temp
          steps.push({
            line: 12,
            description: `Moving temp to next node`,
            action: () => {
              viz.clearHighlights('visiting');
              viz.highlightNode(nodeI + 1, 'visiting');
              viz._addPointerLabels([{ nodeIndex: nodeI + 1, labels: ['temp'] }]);
              viz.setStatus(`temp = temp->next (now at ${viz.nodes[nodeI + 1].address})`);
            },
          });
        }

        // Final while check (false — temp->next is NULL)
        steps.push({
          line: 11,
          description: 'Checking temp->next != NULL → FALSE',
          action: () => {
            viz._showDecision(false, 'temp->next != NULL');
            viz.setStatus('temp->next == NULL → loop exits');
          },
        });

        // Step: temp->next = newNode
        steps.push({
          line: 14,
          description: 'Linking temp->next = newNode',
          action: () => {
            viz.clearHighlights('visiting');
            const insertIdx = viz.nodes.length;
            viz.nodes.push(viz._traceNewNode);
            viz._linkNodes();
            viz.render();
            viz._addPointerLabels([
              { nodeIndex: insertIdx - 1, labels: ['temp'] },
              { nodeIndex: insertIdx, labels: ['newNode'] },
            ]);
            viz.highlightNode(insertIdx, 'inserting');
            viz.setStatus(`temp->next = newNode — node ${viz._traceNewNode.address} linked at end`);
          },
        });
      }

      // Step: Function end
      steps.push({
        line: 16,
        description: 'Insert complete',
        action: () => {
          viz.clearHighlights('inserting', 'visiting');
          viz._clearPointerLabels();
          viz._clearDecision();
          viz._clearFloatingNode();
          viz.render();
          viz.setStatus(`Node with value ${value} inserted successfully.`);
          viz._traceNewNode = null;
        },
      });

      return { codeLines, steps };
    },

    /**
     * Insert at a specific position (before/after an index).
     */
    insertAt: (viz, index, value, position) => {
      const insertIdx = position === 'before' ? index : index + 1;
      const isAtBeginning = insertIdx === 0;
      const isAtEnd = insertIdx >= viz.nodes.length;

      const codeLines = [
        `void insertAt(Node** head, int pos, int value) {`,      // 1
        '    struct Node *newNode, *temp;',                       // 2
        '    newNode = (struct Node *)malloc(sizeof(struct Node));', // 3
        '    newNode->data = value;',                            // 4
        '    newNode->next = NULL;',                             // 5
        '',                                                      // 6
        '    if (pos == 0) {',                                   // 7
        '        newNode->next = *head;',                        // 8
        '        *head = newNode;',                              // 9
        '        return;',                                       // 10
        '    }',                                                 // 11
        '',                                                      // 12
        '    temp = *head;',                                     // 13
        '    for (int i = 0; i < pos - 1 && temp; i++) {',      // 14
        '        temp = temp->next;',                            // 15
        '    }',                                                 // 16
        '',                                                      // 17
        '    newNode->next = temp->next;',                       // 18
        '    temp->next = newNode;',                             // 19
        '}',                                                     // 20
      ];

      const steps = [];

      // Step 1: Function entry
      steps.push({
        line: 1,
        description: `Calling insertAt(head, ${insertIdx}, ${value})`,
        action: () => viz.setStatus(`Calling insertAt(head, ${insertIdx}, ${value})…`),
      });

      // Step 2: Declare variables
      steps.push({
        line: 2,
        description: 'Declaring pointers newNode and temp',
        action: () => viz.setStatus('Declared struct Node *newNode, *temp;'),
      });

      // Step 3: malloc
      steps.push({
        line: 3,
        description: 'Allocating memory for new node',
        action: () => {
          viz._traceNewNode = viz._createTracedNode(value);
          viz._renderWithFloatingNode(viz._traceNewNode, '?', 'NULL');
          viz.setStatus(`malloc() → allocated node at ${viz._traceNewNode.address}`);
        },
      });

      // Step 4: Assign data
      steps.push({
        line: 4,
        description: `Setting newNode->data = ${value}`,
        action: () => {
          viz._renderWithFloatingNode(viz._traceNewNode, value, 'NULL');
          viz.setStatus(`newNode->data = ${value}`);
        },
      });

      // Step 5: next = NULL
      steps.push({
        line: 5,
        description: 'Setting newNode->next = NULL',
        action: () => {
          viz._renderWithFloatingNode(viz._traceNewNode, value, 'NULL', ['newNode']);
          viz.setStatus('newNode->next = NULL');
        },
      });

      if (isAtBeginning) {
        // pos == 0 → TRUE
        steps.push({
          line: 7,
          description: 'Checking pos == 0 → TRUE',
          action: () => {
            viz._showDecision(true, 'pos == 0');
            viz.setStatus('pos == 0 → TRUE — inserting at beginning');
          },
        });

        // newNode->next = *head
        steps.push({
          line: 8,
          description: 'Setting newNode->next = *head',
          action: () => {
            viz.setStatus(`newNode->next = head (${viz.head ? viz.head.address : 'NULL'})`);
          },
        });

        // *head = newNode
        steps.push({
          line: 9,
          description: 'Setting *head = newNode',
          action: () => {
            viz.nodes.unshift(viz._traceNewNode);
            viz._linkNodes();
            viz.render();
            viz._addPointerLabels([{ nodeIndex: 0, labels: ['head', 'newNode'] }]);
            viz.highlightNode(0, 'inserting');
            viz.setStatus(`*head = newNode — head now points to ${viz._traceNewNode.address}`);
          },
        });
      } else {
        // pos == 0 → FALSE
        steps.push({
          line: 7,
          description: 'Checking pos == 0 → FALSE',
          action: () => {
            viz._showDecision(false, 'pos == 0');
            viz.setStatus('pos == 0 → FALSE');
          },
        });

        // temp = *head
        steps.push({
          line: 13,
          description: 'Setting temp = *head',
          action: () => {
            viz.render();
            viz._addPointerLabels([{ nodeIndex: 0, labels: ['head', 'temp'] }]);
            viz.highlightNode(0, 'visiting');
            viz.setStatus(`temp = *head (${viz.nodes[0].address})`);
          },
        });

        // Traverse to position
        for (let i = 0; i < insertIdx - 1 && i < viz.nodes.length - 1; i++) {
          const nodeI = i;
          steps.push({
            line: 14,
            description: `Loop: i = ${nodeI}, i < ${insertIdx - 1}`,
            action: () => {
              viz._showDecision(true, `i < pos - 1`);
              viz.setStatus(`i = ${nodeI} < ${insertIdx - 1} → TRUE`);
            },
          });

          steps.push({
            line: 15,
            description: 'Moving temp = temp->next',
            action: () => {
              viz.clearHighlights('visiting');
              viz.highlightNode(nodeI + 1, 'visiting');
              viz._addPointerLabels([{ nodeIndex: nodeI + 1, labels: ['temp'] }]);
              viz.setStatus(`temp = temp->next (now at ${viz.nodes[nodeI + 1].address})`);
            },
          });
        }

        // newNode->next = temp->next
        const tempIdx = Math.min(insertIdx - 1, viz.nodes.length - 1);
        steps.push({
          line: 18,
          description: 'Setting newNode->next = temp->next',
          action: () => {
            const nextAddr = viz.nodes[tempIdx].next ? viz.nodes[tempIdx].next.address : 'NULL';
            viz.setStatus(`newNode->next = temp->next (${nextAddr})`);
          },
        });

        // temp->next = newNode
        steps.push({
          line: 19,
          description: 'Linking temp->next = newNode',
          action: () => {
            viz.clearHighlights('visiting');
            if (insertIdx >= viz.nodes.length) {
              viz.nodes.push(viz._traceNewNode);
            } else {
              viz.nodes.splice(insertIdx, 0, viz._traceNewNode);
            }
            viz._linkNodes();
            viz.render();
            viz._addPointerLabels([
              { nodeIndex: tempIdx, labels: ['temp'] },
              { nodeIndex: insertIdx, labels: ['newNode'] },
            ]);
            viz.highlightNode(insertIdx, 'inserting');
            viz.setStatus(`temp->next = newNode — inserted at position ${insertIdx}`);
          },
        });
      }

      // Function end
      steps.push({
        line: 20,
        description: 'Insert complete',
        action: () => {
          viz.clearHighlights('inserting', 'visiting');
          viz._clearPointerLabels();
          viz._clearDecision();
          viz._clearFloatingNode();
          viz.render();
          viz.setStatus(`Node with value ${value} inserted at position ${insertIdx}.`);
          viz._traceNewNode = null;
        },
      });

      return { codeLines, steps };
    },

    /**
     * Delete operation.
     */
    delete: (viz, index) => {
      const isFirst = index === 0;
      const nodeToDelete = viz.nodes[index];

      const codeLines = [
        'void deleteAt(Node** head, int pos) {',                 // 1
        '    if (*head == NULL) return;',                         // 2
        '',                                                      // 3
        '    struct Node *temp = *head;',                        // 4
        '',                                                      // 5
        '    if (pos == 0) {',                                   // 6
        '        *head = temp->next;',                           // 7
        '        free(temp);',                                   // 8
        '        return;',                                       // 9
        '    }',                                                 // 10
        '',                                                      // 11
        '    for (int i = 0; temp != NULL && i < pos - 1; i++)', // 12
        '        temp = temp->next;',                            // 13
        '',                                                      // 14
        '    if (temp == NULL || temp->next == NULL) return;',   // 15
        '',                                                      // 16
        '    struct Node *next = temp->next->next;',             // 17
        '    free(temp->next);',                                 // 18
        '    temp->next = next;',                                // 19
        '}',                                                     // 20
      ];

      const steps = [];

      // Step 1: Function entry
      steps.push({
        line: 1,
        description: `Calling deleteAt(head, ${index})`,
        action: () => viz.setStatus(`Calling deleteAt(head, ${index})…`),
      });

      // Step 2: Check head == NULL
      steps.push({
        line: 2,
        description: 'Checking *head == NULL → FALSE',
        action: () => {
          viz._showDecision(false, '*head == NULL');
          viz.setStatus('*head != NULL → list is not empty');
        },
      });

      // Step 3: temp = *head
      steps.push({
        line: 4,
        description: 'Setting temp = *head',
        action: () => {
          viz._clearDecision();
          viz._addPointerLabels([{ nodeIndex: 0, labels: ['head', 'temp'] }]);
          viz.highlightNode(0, 'visiting');
          viz.setStatus(`temp = *head (${viz.nodes[0].address})`);
        },
      });

      if (isFirst) {
        // pos == 0 → TRUE
        steps.push({
          line: 6,
          description: 'Checking pos == 0 → TRUE',
          action: () => {
            viz._showDecision(true, 'pos == 0');
            viz.setStatus('pos == 0 → TRUE — deleting first node');
          },
        });

        // *head = temp->next
        steps.push({
          line: 7,
          description: 'Setting *head = temp->next',
          action: () => {
            const nextAddr = viz.nodes[0].next ? viz.nodes[0].next.address : 'NULL';
            viz.setStatus(`*head = temp->next (${nextAddr})`);
          },
        });

        // free(temp)
        steps.push({
          line: 8,
          description: 'Freeing temp (deallocating memory)',
          action: () => {
            viz.highlightNode(0, 'deleting');
            viz.setStatus(`free(temp) — deallocating node at ${nodeToDelete.address}`);
          },
        });

        // Apply deletion
        steps.push({
          line: 9,
          description: 'Deletion complete, returning',
          action: () => {
            viz.clearHighlights('visiting', 'deleting');
            viz.nodes.splice(0, 1);
            viz._linkNodes();
            viz.render();
            viz.setStatus('First node deleted. HEAD updated.');
          },
        });
      } else {
        // pos == 0 → FALSE
        steps.push({
          line: 6,
          description: 'Checking pos == 0 → FALSE',
          action: () => {
            viz._showDecision(false, 'pos == 0');
            viz.setStatus('pos == 0 → FALSE');
          },
        });

        // Traverse to pos - 1
        for (let i = 0; i < index - 1 && i < viz.nodes.length - 1; i++) {
          const nodeI = i;
          steps.push({
            line: 12,
            description: `Loop: i = ${nodeI}`,
            action: () => {
              viz._showDecision(true, `i < pos - 1`);
              viz.setStatus(`i = ${nodeI} < ${index - 1} → continuing traversal`);
            },
          });

          steps.push({
            line: 13,
            description: 'Moving temp = temp->next',
            action: () => {
              viz.clearHighlights('visiting');
              viz.highlightNode(nodeI + 1, 'visiting');
              viz._addPointerLabels([{ nodeIndex: nodeI + 1, labels: ['temp'] }]);
              viz.setStatus(`temp = temp->next (now at ${viz.nodes[nodeI + 1].address})`);
            },
          });
        }

        const tempIdx = index - 1;

        // next = temp->next->next
        steps.push({
          line: 17,
          description: 'Saving reference: next = temp->next->next',
          action: () => {
            const nextNextAddr = viz.nodes[index].next ? viz.nodes[index].next.address : 'NULL';
            viz._addPointerLabels([
              { nodeIndex: tempIdx, labels: ['temp'] },
              { nodeIndex: index, labels: ['to delete'] },
            ]);
            viz.highlightNode(index, 'deleting');
            viz.setStatus(`next = temp->next->next (${nextNextAddr})`);
          },
        });

        // free(temp->next)
        steps.push({
          line: 18,
          description: 'Freeing temp->next',
          action: () => {
            viz.setStatus(`free(temp->next) — deallocating node at ${nodeToDelete.address}`);
          },
        });

        // temp->next = next
        steps.push({
          line: 19,
          description: 'Relinking: temp->next = next',
          action: () => {
            viz.clearHighlights('visiting', 'deleting');
            viz.nodes.splice(index, 1);
            viz._linkNodes();
            viz.render();
            if (tempIdx < viz.nodes.length) {
              viz._addPointerLabels([{ nodeIndex: tempIdx, labels: ['temp'] }]);
            }
            const nextAddr = viz.nodes[tempIdx] && viz.nodes[tempIdx].next
              ? viz.nodes[tempIdx].next.address : 'NULL';
            viz.setStatus(`temp->next = next (${nextAddr}) — bypass complete`);
          },
        });
      }

      // Function end
      steps.push({
        line: 20,
        description: 'Delete complete',
        action: () => {
          viz.clearHighlights('inserting', 'visiting', 'deleting');
          viz._clearPointerLabels();
          viz._clearDecision();
          viz.render();
          viz.setStatus(`Node at position ${index} deleted successfully.`);
        },
      });

      return { codeLines, steps };
    },

    /**
     * Traverse operation.
     */
    traverse: (viz) => {
      const codeLines = [
        'void traverse(Node* head) {',         // 1
        '    Node* current = head;',            // 2
        '    while (current != NULL) {',        // 3
        '        printf("%d ", current->data);', // 4
        '        current = current->next;',     // 5
        '    }',                                // 6
        '    printf("\\n");',                   // 7
        '}',                                    // 8
      ];

      const steps = [];

      // Step 1: Function entry
      steps.push({
        line: 1,
        description: 'Starting traversal',
        action: () => viz.setStatus('Starting linked list traversal…'),
      });

      // Step 2: current = head
      steps.push({
        line: 2,
        description: 'Setting current = head',
        action: () => {
          if (viz.nodes.length > 0) {
            viz._addPointerLabels([{ nodeIndex: 0, labels: ['current'] }]);
            viz.highlightNode(0, 'visiting');
            viz.setStatus(`current = head (${viz.nodes[0].address})`);
          } else {
            viz.setStatus('current = head (NULL — empty list)');
          }
        },
      });

      // Traverse each node
      for (let i = 0; i < viz.nodes.length; i++) {
        const nodeI = i;
        const node = viz.nodes[i];

        // while (current != NULL) → TRUE
        steps.push({
          line: 3,
          description: `Checking current != NULL at node ${nodeI}`,
          action: () => {
            viz._showDecision(true, 'current != NULL');
            viz.setStatus(`current != NULL → TRUE (at ${node.address})`);
          },
        });

        // printf — read data
        steps.push({
          line: 4,
          description: `Printing current->data: ${node.value}`,
          action: () => {
            viz.clearHighlights('visiting');
            viz.highlightNode(nodeI, 'visiting');
            viz._clearDecision();
            viz.setStatus(`printf: current->data = ${node.value}`);
          },
        });

        // current = current->next
        if (i < viz.nodes.length - 1) {
          steps.push({
            line: 5,
            description: 'Moving current = current->next',
            action: () => {
              viz.clearHighlights('visiting');
              viz.highlightNode(nodeI + 1, 'visiting');
              viz._addPointerLabels([{ nodeIndex: nodeI + 1, labels: ['current'] }]);
              viz.setStatus(`current = current->next (now at ${viz.nodes[nodeI + 1].address})`);
            },
          });
        } else {
          steps.push({
            line: 5,
            description: 'Moving current = current->next (NULL)',
            action: () => {
              viz.clearHighlights('visiting');
              viz._clearPointerLabels();
              viz.setStatus('current = current->next (NULL)');
            },
          });
        }
      }

      // while (current != NULL) → FALSE
      steps.push({
        line: 3,
        description: 'Checking current != NULL → FALSE',
        action: () => {
          viz._showDecision(false, 'current != NULL');
          viz.setStatus('current == NULL → loop exits');
        },
      });

      // End
      steps.push({
        line: 8,
        description: 'Traversal complete',
        action: () => {
          viz.clearHighlights('visiting');
          viz._clearPointerLabels();
          viz._clearDecision();
          viz.setStatus('Traversal complete — reached NULL.');
        },
      });

      return { codeLines, steps };
    },

    /**
     * Search operation.
     */
    search: (viz, target) => {
      const codeLines = [
        `int search(Node* head, int target) {`,    // 1
        '    Node* current = head;',                // 2
        '    int index = 0;',                       // 3
        '',                                          // 4
        '    while (current != NULL) {',            // 5
        '        if (current->data == target) {',   // 6
        '            return index;  // Found!',     // 7
        '        }',                                 // 8
        '        current = current->next;',         // 9
        '        index++;',                          // 10
        '    }',                                     // 11
        '    return -1;  // Not found',             // 12
        '}',                                         // 13
      ];

      const steps = [];
      let foundIndex = -1;

      // Find if target exists
      for (let i = 0; i < viz.nodes.length; i++) {
        if (viz.nodes[i].value == target) {
          foundIndex = i;
          break;
        }
      }

      // Step 1: Function entry
      steps.push({
        line: 1,
        description: `Searching for ${target}`,
        action: () => viz.setStatus(`Calling search(head, ${target})…`),
      });

      // Step 2-3: Initialize
      steps.push({
        line: [2, 3],
        description: 'Initializing current = head, index = 0',
        action: () => {
          if (viz.nodes.length > 0) {
            viz._addPointerLabels([{ nodeIndex: 0, labels: ['current'] }]);
            viz.setStatus('current = head, index = 0');
          } else {
            viz.setStatus('current = head (NULL), index = 0');
          }
        },
      });

      // Search through each node
      const limit = foundIndex >= 0 ? foundIndex + 1 : viz.nodes.length;
      for (let i = 0; i < limit; i++) {
        const nodeI = i;
        const node = viz.nodes[i];

        // while (current != NULL) → TRUE
        steps.push({
          line: 5,
          description: `Checking current != NULL → TRUE`,
          action: () => {
            viz._showDecision(true, 'current != NULL');
            viz.setStatus(`current != NULL → TRUE (at ${node.address})`);
          },
        });

        if (i === foundIndex) {
          // Found!
          steps.push({
            line: 6,
            description: `Comparing current->data (${node.value}) == ${target} → TRUE`,
            action: () => {
              viz.clearHighlights('comparing', 'visiting');
              viz.highlightNode(nodeI, 'found');
              viz._showDecision(true, `${node.value} == ${target}`);
              viz.setStatus(`current->data == ${target} → FOUND at index ${nodeI}!`);
            },
          });

          steps.push({
            line: 7,
            description: `Returning index ${nodeI}`,
            action: () => {
              viz._clearDecision();
              viz.setStatus(`Found ${target} at index ${nodeI} (${node.address})`);
            },
          });
        } else {
          // Not a match
          steps.push({
            line: 6,
            description: `Comparing current->data (${node.value}) == ${target} → FALSE`,
            action: () => {
              viz.clearHighlights('comparing', 'visiting');
              viz.highlightNode(nodeI, 'comparing');
              viz._showDecision(false, `${node.value} == ${target}`);
              viz.setStatus(`current->data (${node.value}) != ${target}`);
            },
          });

          // current = current->next
          steps.push({
            line: [9, 10],
            description: 'Moving to next node, index++',
            action: () => {
              viz.clearHighlights('comparing');
              viz._clearDecision();
              if (nodeI + 1 < viz.nodes.length) {
                viz._addPointerLabels([{ nodeIndex: nodeI + 1, labels: ['current'] }]);
              } else {
                viz._clearPointerLabels();
              }
              viz.setStatus(`current = current->next, index = ${nodeI + 1}`);
            },
          });
        }
      }

      // If not found
      if (foundIndex < 0) {
        steps.push({
          line: 5,
          description: 'Checking current != NULL → FALSE',
          action: () => {
            viz._showDecision(false, 'current != NULL');
            viz.setStatus('current == NULL → search exhausted');
          },
        });

        steps.push({
          line: 12,
          description: 'Returning -1 (not found)',
          action: () => viz.setStatus(`${target} not found in the linked list.`),
        });
      }

      // End
      steps.push({
        line: 13,
        description: 'Search complete',
        action: () => {
          viz._clearPointerLabels();
          viz._clearDecision();
        },
      });

      return { codeLines, steps };
    },

    /**
     * Update operation.
     */
    update: (viz, index, newValue) => {
      const oldValue = viz.nodes[index].value;

      const codeLines = [
        'void updateAt(Node* head, int pos, int value) {', // 1
        '    Node* current = head;',                        // 2
        '    for (int i = 0; i < pos && current; i++) {',  // 3
        '        current = current->next;',                 // 4
        '    }',                                             // 5
        '',                                                  // 6
        '    if (current != NULL) {',                       // 7
        '        current->data = value;',                   // 8
        '    }',                                             // 9
        '}',                                                 // 10
      ];

      const steps = [];

      // Function entry
      steps.push({
        line: 1,
        description: `Calling updateAt(head, ${index}, ${newValue})`,
        action: () => viz.setStatus(`Calling updateAt(head, ${index}, ${newValue})…`),
      });

      // current = head
      steps.push({
        line: 2,
        description: 'Setting current = head',
        action: () => {
          viz._addPointerLabels([{ nodeIndex: 0, labels: ['current'] }]);
          viz.highlightNode(0, 'visiting');
          viz.setStatus(`current = head (${viz.nodes[0].address})`);
        },
      });

      // Traverse to index
      for (let i = 0; i < index; i++) {
        const nodeI = i;
        steps.push({
          line: 3,
          description: `Loop: i = ${nodeI} < ${index}`,
          action: () => {
            viz._showDecision(true, `i < pos`);
            viz.setStatus(`i = ${nodeI} < ${index} → TRUE`);
          },
        });

        steps.push({
          line: 4,
          description: 'Moving current = current->next',
          action: () => {
            viz.clearHighlights('visiting');
            viz.highlightNode(nodeI + 1, 'visiting');
            viz._addPointerLabels([{ nodeIndex: nodeI + 1, labels: ['current'] }]);
            viz._clearDecision();
            viz.setStatus(`current = current->next (now at ${viz.nodes[nodeI + 1].address})`);
          },
        });
      }

      // Check current != NULL
      steps.push({
        line: 7,
        description: 'Checking current != NULL → TRUE',
        action: () => {
          viz._showDecision(true, 'current != NULL');
          viz.setStatus('current != NULL → TRUE');
        },
      });

      // Update value
      steps.push({
        line: 8,
        description: `Setting current->data = ${newValue}`,
        action: () => {
          viz.clearHighlights('visiting');
          viz.nodes[index].value = newValue;
          viz.render();
          viz.highlightNode(index, 'found');
          viz._addPointerLabels([{ nodeIndex: index, labels: ['current'] }]);
          viz._clearDecision();
          viz.setStatus(`current->data = ${newValue} (was ${oldValue})`);
        },
      });

      // End
      steps.push({
        line: 10,
        description: 'Update complete',
        action: () => {
          viz.clearHighlights('found', 'visiting');
          viz._clearPointerLabels();
          viz._clearDecision();
          viz.render();
          viz.setStatus(`Node at index ${index} updated from ${oldValue} to ${newValue}.`);
        },
      });

      return { codeLines, steps };
    },

    /**
     * Reverse operation.
     */
    reverse: (viz) => {
      const codeLines = [
        'void reverse(Node** head) {',         // 1
        '    Node *prev = NULL;',               // 2
        '    Node *current = *head;',           // 3
        '    Node *next = NULL;',               // 4
        '',                                      // 5
        '    while (current != NULL) {',        // 6
        '        next = current->next;',        // 7
        '        current->next = prev;',        // 8
        '        prev = current;',              // 9
        '        current = next;',              // 10
        '    }',                                 // 11
        '    *head = prev;',                    // 12
        '}',                                     // 13
      ];

      const steps = [];
      const nodeCount = viz.nodes.length;

      // Function entry
      steps.push({
        line: 1,
        description: 'Starting reverse',
        action: () => viz.setStatus('Calling reverse(head)…'),
      });

      // Initialize
      steps.push({
        line: [2, 3, 4],
        description: 'Initializing prev = NULL, current = *head, next = NULL',
        action: () => {
          if (viz.nodes.length > 0) {
            viz._addPointerLabels([{ nodeIndex: 0, labels: ['current'] }]);
            viz.highlightNode(0, 'visiting');
          }
          viz.setStatus('prev = NULL, current = *head, next = NULL');
        },
      });

      // For each node in the original order
      for (let i = 0; i < nodeCount; i++) {
        const nodeI = i;

        // while (current != NULL) → TRUE
        steps.push({
          line: 6,
          description: 'Checking current != NULL → TRUE',
          action: () => {
            viz._showDecision(true, 'current != NULL');
            viz.setStatus(`current != NULL → TRUE (iteration ${nodeI + 1})`);
          },
        });

        // next = current->next
        steps.push({
          line: 7,
          description: 'Saving next = current->next',
          action: () => {
            viz._clearDecision();
            const nextAddr = nodeI + 1 < nodeCount ? viz.nodes[nodeI + 1].address : 'NULL';
            viz.setStatus(`next = current->next (${nextAddr})`);
          },
        });

        // current->next = prev (the pointer reversal!)
        steps.push({
          line: 8,
          description: 'Reversing pointer: current->next = prev',
          action: () => {
            const prevAddr = nodeI > 0 ? viz.nodes[nodeI - 1].address : 'NULL';
            viz.highlightNode(nodeI, 'comparing');
            viz.setStatus(`current->next = prev (${prevAddr}) — pointer reversed!`);
          },
        });

        // prev = current
        steps.push({
          line: 9,
          description: 'Moving prev = current',
          action: () => {
            viz.clearHighlights('comparing');
            viz._addPointerLabels([{ nodeIndex: nodeI, labels: ['prev'] }]);
            viz.setStatus(`prev = current (${viz.nodes[nodeI].address})`);
          },
        });

        // current = next
        steps.push({
          line: 10,
          description: 'Moving current = next',
          action: () => {
            viz.clearHighlights('visiting');
            if (nodeI + 1 < nodeCount) {
              viz.highlightNode(nodeI + 1, 'visiting');
              viz._addPointerLabels([
                { nodeIndex: nodeI, labels: ['prev'] },
                { nodeIndex: nodeI + 1, labels: ['current'] },
              ]);
              viz.setStatus(`current = next (${viz.nodes[nodeI + 1].address})`);
            } else {
              viz._addPointerLabels([{ nodeIndex: nodeI, labels: ['prev'] }]);
              viz.setStatus('current = next (NULL)');
            }
          },
        });
      }

      // while (current != NULL) → FALSE
      steps.push({
        line: 6,
        description: 'Checking current != NULL → FALSE',
        action: () => {
          viz._showDecision(false, 'current != NULL');
          viz.setStatus('current == NULL → loop exits');
        },
      });

      // *head = prev
      steps.push({
        line: 12,
        description: 'Setting *head = prev',
        action: () => {
          viz._clearDecision();
          // Actually reverse the array
          viz.nodes.reverse();
          viz._linkNodes();
          viz.render();
          viz.setStatus(`*head = prev — list is now reversed! Head: ${viz.head.address}`);
        },
      });

      // End
      steps.push({
        line: 13,
        description: 'Reverse complete',
        action: () => {
          viz.clearHighlights('visiting', 'comparing');
          viz._clearPointerLabels();
          viz._clearDecision();
          viz.render();
          viz.setStatus('Linked list reversed successfully.');
        },
      });

      return { codeLines, steps };
    },
  },

  python: {
    /**
     * Insert operation (Python version).
     */
    insert: (viz, value, isFirstNode) => {
      const codeLines = [
        'def insert(self, value):',                    // 1
        '    new_node = Node(value)',                   // 2
        '    new_node.data = value',                   // 3
        '    new_node.next = None',                    // 4
        '',                                             // 5
        '    if self.head is None:',                   // 6
        '        self.head = new_node',                // 7
        '    else:',                                    // 8
        '        temp = self.head',                    // 9
        '        while temp.next is not None:',        // 10
        '            temp = temp.next',                // 11
        '        temp.next = new_node',                // 12
      ];

      // Reuse the C logic but with Python line numbers
      const cTrace = LinkedListTraceSteps.c.insert(viz, value, isFirstNode);
      // Map C steps to Python lines
      const lineMapping = {
        1: 1, 2: 1, 3: 2, 4: 3, 5: 4,
        7: 6, 8: 7,
        10: 9, 11: 10, 12: 11, 14: 12,
        16: 12,
      };

      const steps = cTrace.steps.map(step => ({
        ...step,
        line: Array.isArray(step.line)
          ? step.line.map(l => lineMapping[l] || l)
          : (lineMapping[step.line] || step.line),
      }));

      return { codeLines, steps };
    },

    insertAt: (viz, index, value, position) => {
      // Delegate to C version with Python code display
      const cTrace = LinkedListTraceSteps.c.insertAt(viz, index, value, position);
      const codeLines = [
        'def insert_at(self, pos, value):',            // 1
        '    new_node = Node(value)',                   // 2
        '    new_node.data = value',                   // 3
        '    new_node.next = None',                    // 4
        '',                                             // 5
        '    if pos == 0:',                            // 6
        '        new_node.next = self.head',           // 7
        '        self.head = new_node',                // 8
        '        return',                               // 9
        '',                                             // 10
        '    temp = self.head',                        // 11
        '    for i in range(pos - 1):',                // 12
        '        if temp is None: break',              // 13
        '        temp = temp.next',                    // 14
        '',                                             // 15
        '    new_node.next = temp.next',               // 16
        '    temp.next = new_node',                    // 17
      ];

      return { codeLines, steps: cTrace.steps };
    },

    delete: (viz, index) => {
      const cTrace = LinkedListTraceSteps.c.delete(viz, index);
      const codeLines = [
        'def delete_at(self, pos):',                   // 1
        '    if self.head is None: return',            // 2
        '',                                             // 3
        '    temp = self.head',                        // 4
        '',                                             // 5
        '    if pos == 0:',                            // 6
        '        self.head = temp.next',               // 7
        '        del temp',                             // 8
        '        return',                               // 9
        '',                                             // 10
        '    for i in range(pos - 1):',                // 11
        '        temp = temp.next',                    // 12
        '',                                             // 13
        '    if temp is None or temp.next is None:',   // 14
        '        return',                               // 15
        '',                                             // 16
        '    next_node = temp.next.next',              // 17
        '    del temp.next',                            // 18
        '    temp.next = next_node',                   // 19
      ];

      return { codeLines, steps: cTrace.steps };
    },

    traverse: (viz) => {
      const cTrace = LinkedListTraceSteps.c.traverse(viz);
      const codeLines = [
        'def traverse(self):',                         // 1
        '    current = self.head',                     // 2
        '    while current is not None:',              // 3
        '        print(current.data, end=" ")',        // 4
        '        current = current.next',              // 5
        '    print()',                                   // 6
      ];

      return { codeLines, steps: cTrace.steps };
    },

    search: (viz, target) => {
      const cTrace = LinkedListTraceSteps.c.search(viz, target);
      const codeLines = [
        `def search(self, target):`,                   // 1
        '    current = self.head',                     // 2
        '    index = 0',                                // 3
        '',                                             // 4
        '    while current is not None:',              // 5
        '        if current.data == target:',          // 6
        '            return index  # Found!',          // 7
        '        current = current.next',              // 8
        '        index += 1',                           // 9
        '    return -1  # Not found',                  // 10
      ];

      return { codeLines, steps: cTrace.steps };
    },

    update: (viz, index, newValue) => {
      const cTrace = LinkedListTraceSteps.c.update(viz, index, newValue);
      const codeLines = [
        'def update_at(self, pos, value):',            // 1
        '    current = self.head',                     // 2
        '    for i in range(pos):',                    // 3
        '        if current is None: return',          // 4
        '        current = current.next',              // 5
        '',                                             // 6
        '    if current is not None:',                 // 7
        '        current.data = value',                // 8
      ];

      return { codeLines, steps: cTrace.steps };
    },

    reverse: (viz) => {
      const cTrace = LinkedListTraceSteps.c.reverse(viz);
      const codeLines = [
        'def reverse(self):',                          // 1
        '    prev = None',                              // 2
        '    current = self.head',                     // 3
        '    next_node = None',                        // 4
        '',                                             // 5
        '    while current is not None:',              // 6
        '        next_node = current.next',            // 7
        '        current.next = prev',                 // 8
        '        prev = current',                      // 9
        '        current = next_node',                 // 10
        '    self.head = prev',                        // 11
      ];

      return { codeLines, steps: cTrace.steps };
    },
  },
};
