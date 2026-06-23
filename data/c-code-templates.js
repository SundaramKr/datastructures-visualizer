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
