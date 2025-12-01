
---

# FileAttachmentIndicator Component Documentation

## Overview

The `FileAttachmentIndicator` component is designed to display information about an attached file, including its name and size. It also provides a remove button to allow users to delete the attached file. This component is useful in forms or file upload interfaces where users need to manage multiple files.

## Properties

The `FileAttachmentIndicator` component accepts the following properties:

- **file**: An object containing information about the file, including `name` and `size`.
- **onRemove**: A callback function that is called when the remove button is clicked.

## Usage

### Basic FileAttachmentIndicator

```jsx
import FileAttachmentIndicator from './FileAttachmentIndicator';

<FileAttachmentIndicator
  file={{ name: 'example_document.pdf', size: 1024 * 1024 }} // 1MB in bytes
  onRemove={() => console.log('File removed!')}
/>
```

### FileAttachmentIndicator with Long File Name

```jsx
import FileAttachmentIndicator from './FileAttachmentIndicator';

<FileAttachmentIndicator
  file={{ name: 'very_long_document_name_that_should_be_truncated.docx', size: 2.5 * 1024 * 1024 }} // 2.5MB
  onRemove={() => console.log('File removed!')}
/>
```

### FileAttachmentIndicator for Text File

```jsx
import FileAttachmentIndicator from './FileAttachmentIndicator';

<FileAttachmentIndicator
  file={{ name: 'notes.txt', size: 512 }} // Half a KB
  onRemove={() => console.log('File removed!')}
/>
```

## CSS Styling

The `FileAttachmentIndicator` component uses inline styles for its layout and appearance. You can customize the styles by modifying the `style` object within the component.

## Storybook Examples

### Default FileAttachmentIndicator

```jsx
export const Default = {
  args: {
    file: {
      name: "example_document.pdf",
      size: 1024 * 1024, // 1MB in bytes
    },
    onRemove: () => console.log("File removed!"),
  },
};
```

### Long File Name

```jsx
export const LongFileName = {
  args: {
    file: {
      name: "very_long_document_name_that_should_be_truncated.docx",
      size: 2.5 * 1024 * 1024, // 2.5MB
    },
    onRemove: () => console.log("File removed!"),
  },
};
```

### Text File

```jsx
export const TextFile = {
  args: {
    file: {
      name: "notes.txt",
      size: 512, // Half a KB
    },
    onRemove: () => console.log("File removed!"),
  },
};
```

## Accessibility

The `FileAttachmentIndicator` component is designed to be accessible, with appropriate ARIA attributes and keyboard interactions. The remove button is focusable and responds to clicks.

## Testing

The `FileAttachmentIndicator` component is tested using Storybook, ensuring that it renders correctly and behaves as expected under various conditions.

---

