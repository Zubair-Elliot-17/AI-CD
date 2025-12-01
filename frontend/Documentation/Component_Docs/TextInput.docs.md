
---

# TextInput Component Documentation

## Overview

The `TextInput` component is a versatile text input field designed to allow users to input text and attach files. It includes features such as character counting, file size validation, and visual feedback for attached files. This component is useful for forms and interfaces where users need to provide text input and upload files.

## Properties

The `TextInput` component accepts the following properties:

- **onSubmit**: A callback function to be called when the submit button is clicked. It receives the text input and the attached file (if any).
- **onFileAttach**: A callback function to be called when a file is attached. It receives the attached file.

## Usage

### Basic TextInput

```jsx
import TextInput from './TextInput';

<TextInput
  onSubmit={(text, file) => alert('Submitted:', text, file)}
  onFileAttach={(file) => alert('File attached:', file.name)}
/>
```

## CSS Styling

The `TextInput` component uses the following CSS classes:

- `.text-input-container`: The main container for the text input component.
- `.text-input-textarea`: The main textarea styling.
- `.text-input-footer`: The footer container with absolute positioning.
- `.text-input-counter`: The character counter styling.
- `.text-input-actions`: The action buttons container.
- `.text-input-attach-button`: The file attachment button hover effect.
- `.text-input-submit-button`: The submit button interactive states.

## Storybook Examples

### Default TextInput

```jsx
export const Default = {
  args: {
    onSubmit: function(text, file) { 
      alert("Submitted:", text, file); 
    },
    onFileAttach: function(file) { 
      alert("File attached:", file.name); 
    },
  },
};
```

## Accessibility

The `TextInput` component is designed to be accessible, with appropriate ARIA attributes and keyboard interactions. The character counter provides visual feedback, and the submit button is disabled when there is no content to submit.

## Testing

The `TextInput` component is tested using Storybook, ensuring that it renders correctly and behaves as expected under various conditions.

---
