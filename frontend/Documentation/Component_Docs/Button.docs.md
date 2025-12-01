
---

# Button Component Documentation

## Overview

The `Button` component is a versatile and customizable button designed to provide a consistent and interactive user experience across the application. It supports various sizes, colors, and states, making it suitable for different use cases.

## Properties

The `Button` component accepts the following properties:

children: The content of the button (e.g., text or icon).
onClick: A callback function to be called when the button is clicked.
variant: The visual style of the button. Options: 'primary', 'secondary', 'success', 'danger'.
size: The size of the button. Options: 'small', 'medium', 'large'.
borderRadius: The border radius of the button.
color: The text color of the button.
backgroundColor: The background color of the button.
disabled: Whether the button is disabled.

## Usage

### Basic Button

```jsx
import Button from './Button';

<Button children="Click me" onClick={() => console.log('Button clicked')} />
```

### Customized Button

```jsx
import Button from './Button';

<Button
  children="Custom Button"
  variant="success"
  size="large"
  borderRadius="8px"
  color="#ffffff"
  backgroundColor="#28a745"
  onClick={() => console.log('Custom button clicked')}
/>
```

### Disabled Button

```jsx
import Button from './Button';

<Button children="Disabled Button" disabled />
```

## Storybook Examples

### Primary Button

```jsx
export const Primary = {
  args: {
    children: 'Click me',
    variant: 'primary',
    size: 'medium',
  },
};
```

### Secondary Button

```jsx
export const Secondary = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};
```

### Success Button

```jsx
export const Success = {
  args: {
    children: 'Success Button',
    variant: 'success',
  },
};
```

### Danger Button

```jsx
export const Danger = {
  args: {
    children: 'Danger Button',
    variant: 'danger',
  },
};
```

### Disabled Button

```jsx
export const Disabled = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};
```

### Small Button

```jsx
export const Small = {
  args: {
    children: 'Small Button',
    size: 'small',
  },
};
```

### Large Button

```jsx
export const Large = {
  args: {
    children: 'Large Button',
    size: 'large',
  },
};
```

### Custom Button

```jsx
export const Custom = {
  args: {
    children: 'Custom Button',
    borderRadius: '8px',
    color: '#ffffff',
    backgroundColor: '#ff5500',
  },
};
```

## CSS Classes

The `Button` component uses the following CSS classes:

- `.custom-button`: The base class for the button.
- `.small`, `.medium`, `.large`: Classes for different button sizes.
- `.primary`, `.secondary`, `.success`, `.danger`: Classes for different button variants.
- `.clicked`: Class added when the button is clicked (for animation).
- `.disabled`: Class added when the button is disabled.

## Custom Styles

The `Button` component allows for custom styles to be applied via the `style` prop. This can be useful for overriding default styles or applying unique visual treatments.

## Accessibility

The `Button` component is designed to be accessible, with appropriate ARIA attributes and keyboard interactions. When the `disabled` prop is set to `true`, the button is not focusable and does not respond to clicks.

## Testing

The `Button` component is tested using Storybook, ensuring that it renders correctly and behaves as expected under various conditions. The tests cover different sizes, variants, and states.

---

