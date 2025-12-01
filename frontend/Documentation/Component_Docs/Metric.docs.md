
---

# Metric Component Documentation

## Overview

The `Metric` component is a circular progress indicator that visually represents a percentage value. It is commonly used to display metrics, progress, or any value that can be represented as a percentage. The component includes a customizable stroke color, size, and stroke width, making it versatile for various use cases.

## Properties

The `Metric` component accepts the following properties:

- **percentage**: The percentage value to display. Default is `0`.
- **size**: The size of the circular progress indicator. Default is `120`.
- **strokeWidth**: The width of the progress stroke. Default is `12`.
- **strokeColor**: The color of the progress stroke. Default is `#8E12D5` (purple).

## Usage

### Basic Metric

```jsx
import Metric from './Metric';

<Metric percentage={65} />
```

### Customized Metric

```jsx
import Metric from './Metric';

<Metric
  percentage={90}
  size={150}
  strokeWidth={15}
  strokeColor="#28a745"
/>
```

## CSS Styling

The `Metric` component uses inline styles for its layout and appearance. You can customize the styles by modifying the `style` object within the component.

## Storybook Examples

### Default Metric

```jsx
export const Default = {
  args: {
    percentage: 65,
  },
};
```

### Metric with 10% Progress

```jsx
export const Ten = {
  args: {
    percentage: 10,
  },
};
```

### Metric with 90% Progress

```jsx
export const Ninety = {
  args: {
    percentage: 90,
  },
};
```

## Accessibility

The `Metric` component is designed to be accessible, with appropriate ARIA attributes and keyboard interactions. The percentage value is displayed as text, ensuring it is readable by screen readers.

## Testing

The `Metric` component is tested using Storybook, ensuring that it renders correctly and behaves as expected under various conditions.

---

