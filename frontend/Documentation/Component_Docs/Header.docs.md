
---

# Header Component Documentation

## Overview

The `Header` component is a simple and reusable header designed to provide a consistent and visually appealing top navigation bar for the application. It includes a clickable logo that can be used to navigate back to the home page or trigger other actions.

## Properties

The `Header` component accepts the following properties:

- **onLogoClick**: A callback function to be called when the logo is clicked.

## Usage

### Basic Header

```jsx
import Header from './Header';

<Header onLogoClick={() => console.log('Logo clicked')} />
```

## CSS Classes

The `Header` component uses the following CSS classes:

- `.header`: The main class for the header.
- `.app-name`: The class for the app name/logo.

## CSS Styling

### Main Header Styling

```css
.header {
  background-color: #F0F7FB; /* Light blue background */
  padding: 0.8rem 2rem; /* Space inside header: top/bottom, left/right */
  display: flex;
  align-items: center; /* Center content vertically */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Shadow at bottom */
  height: 64px; /* Fixed height */
}
```

### App Name/Logo Styling

```css
.app-name {
  font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
  font-weight: bold; /* Make text bold */
  color: #3D2D4C; /* Dark purple color */
  font-size: 1.5rem; /* Text size */
  cursor: pointer; /* Show hand cursor when hovering over logo */
  margin: 0; 
}
```

## Storybook Examples

### Default Header

```jsx
export const Default = {
  args: {
    onLogoClick: () => console.log("Logo clicked!"), // Just log instead of annoying alert
  },
};
```

## Accessibility

The `Header` component is designed to be accessible, with appropriate ARIA attributes and keyboard interactions. The logo is clickable and provides visual feedback when hovered over.

## Testing

The `Header` component is tested using Storybook, ensuring that it renders correctly and behaves as expected under various conditions.

---

