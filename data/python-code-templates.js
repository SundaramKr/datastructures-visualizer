// Python Code Templates
const PythonCodeTemplates = {
  array: {
    create: (values, capacity) => `# Create array with ${values.length} elements (capacity: ${capacity})
def main():
    arr = [${values.join(', ')}]
    # Python lists are dynamic, but we can track capacity
    capacity = ${capacity}
    
    # Array is now ready for operations
    return arr

if __name__ == "__main__":
    main()`,
    insert: (index, value, position) => `# Insert ${value} at index ${position === 'before' ? index : index + 1}
def insert_at(arr, index, value):
    # Python handles shifting automatically
    arr.insert(index, value)
    return arr`,
    delete: (index) => `# Delete element at index ${index}
def delete_at(arr, index):
    if 0 <= index < len(arr):
        # Python handles shifting automatically
        del arr[index]
    return arr`,
    update: (index, value) => `# Update element at index ${index} to ${value}
def update_at(arr, index, value):
    if 0 <= index < len(arr):
        arr[index] = value
    return arr`,
    traverse: () => `# Traverse the array
def traverse(arr):
    for element in arr:
        print(element, end=' ')
    print()`,
    search: (target) => `# Search for ${target} in the array
def search(arr, target):
    for i, element in enumerate(arr):
        if element == target:
            return i  # Found at index i
    return -1  # Not found`,
    highlight: (index) => `# Access element at index ${index}
def get_element(arr, index):
    if 0 <= index < len(arr):
        return arr[index]
    return None`
  },
  linkedlist: {
    create: (values) => `# Create linked list with ${values.length} nodes
class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def create_linked_list(values):
    if not values:
        return None
    
    head = Node(values[0])
    current = head
    
    for value in values[1:]:
        current.next = Node(value)
        current = current.next
    
    return head

def main():
    values = [${values.join(', ')}]
    head = create_linked_list(values)
    
    # Linked list is now ready for operations
    return head

if __name__ == "__main__":
    main()`,
    insert: (index, value, position) => `# Insert ${value} ${position === 'before' ? 'before' : 'after'} node ${index}
class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def insert_at(head, index, value, position='after'):
    new_node = Node(value)
    
    if index == 0 and position == 'before':
        new_node.next = head
        return new_node
    
    current = head
    for i in range(index):
        if current.next is None:
            break
        current = current.next
    
    if position == 'after':
        new_node.next = current.next
        current.next = new_node
    else:
        # Insert before current node
        new_node.next = current
        # Need to find previous node to update its next pointer
        # Simplified: assumes we have access to previous node
    
    return head`,
    delete: (index) => `# Delete node at index ${index}
class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def delete_at(head, index):
    if head is None:
        return None
    
    if index == 0:
        return head.next
    
    current = head
    for i in range(index - 1):
        if current.next is None:
            return head
        current = current.next
    
    if current.next is not None:
        current.next = current.next.next
    
    return head`,
    update: (index, value) => `# Update node at index ${index} to ${value}
class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def update_at(head, index, value):
    current = head
    for i in range(index):
        if current is None:
            return head
        current = current.next
    
    if current is not None:
        current.data = value
    
    return head`,
    traverse: () => `# Traverse the linked list
class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def traverse(head):
    current = head
    while current is not None:
        print(current.data, end=' ')
        current = current.next
    print()`,
    search: (target) => `# Search for ${target} in the linked list
class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def search(head, target):
    current = head
    index = 0
    
    while current is not None:
        if current.data == target:
            return index
        current = current.next
        index += 1
    
    return -1  # Not found`,
    highlight: (index) => `# Access node at index ${index}
class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def get_node(head, index):
    current = head
    for i in range(index):
        if current is None:
            return None
        current = current.next
    return current`
  }
};
