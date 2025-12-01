
---

# Panel Component Documentation

## Overview

The `Panel` component is a side panel designed to display a list of navigation buttons. It is commonly used for navigation menus in web applications. The component allows for dynamic selection of buttons and provides visual feedback on the currently selected item.

## Properties

The `Panel` component accepts the following properties:

- **buttons**: An array of button labels.
- **onSelect**: A callback function that is called when a button is selected.

## Usage

### Basic Panel

```jsx
import Panel from './Panel';

<Panel
  buttons={["AI Text Detector", "History"]}
  onSelect={(button) => console.log('Selected:', button)}
/>
```

## CSS Styling

The `Panel` component uses inline styles for its layout and appearance. You can customize the styles by modifying the `style` object within the component.

## Storybook Examples

### Default Panel

```jsx
export const Default = {
  args: {
    buttons: ["AI Text Detector", "History"],
    onSelect: (button) => alert("Selected:", button),
  },
};
```

## Accessibility

The `Panel` component is designed to be accessible, with appropriate ARIA attributes and keyboard interactions. The buttons are focusable and respond to clicks.

## Testing

The `Panel` component is tested using Storybook, ensuring that it renders correctly and behaves as expected under various conditions.

---

