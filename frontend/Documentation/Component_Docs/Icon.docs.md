
---

# Icon Component Documentation

## Overview

The `Icon` component is a versatile and customizable icon wrapper designed to provide a consistent and interactive user experience across the application. It supports various sizes, colors, and states, making it suitable for different use cases.

## Properties

The `Icon` component accepts the following properties:

- **icon**: The actual icon component from `react-icons`.
- **color**: The color of the icon. Default is `#8E12D5`.
- **backgroundColor**: The background color of the icon container. Default is `white`.
- **size**: The size of the icon container. Default is `40`.
- **isClickable**: Whether the icon is clickable. Default is `true`.
- **isDisabled**: Whether the icon is disabled. Default is `false`.
- **onClick**: A callback function to be called when the icon is clicked.
- **className**: Additional class names to apply to the icon container.
- **props**: Additional props to pass to the icon container.

## Usage

### Basic Icon

```jsx
import Icon from './Icon';
import { MdAttachFile } from 'react-icons/md';

<Icon icon={MdAttachFile} />
```

### Customized Icon

```jsx
import Icon from './Icon';
import { MdFavorite } from 'react-icons/md';

<Icon
  icon={MdFavorite}
  color="white"
  backgroundColor="#8E12D5"
  size={60}
  onClick={() => console.log('Icon clicked')}
/>
```

### Disabled Icon

```jsx
import Icon from './Icon';
import { MdArrowUpward } from 'react-icons/md';

<Icon icon={MdArrowUpward} isDisabled />
```

## CSS Classes

The `Icon` component uses the following CSS classes:

- `.icon-container`: The main class for the icon container.


## Storybook Examples

### Paperclip Icon

```jsx
export const Paperclip = {
  args: {
    icon: MdAttachFile,
  },
};
```

### Arrow Up Icon

```jsx
export const ArrowUp = {
  args: {
    icon: MdArrowUpward,
    color: 'white',
    backgroundColor: '#8E12D5',
  },
};
```

### Heart Icon

```jsx
export const Heart = {
  args: {
    icon: MdFavorite,
    color: '#FF3366',
  },
};
```

### Disabled Icon

```jsx
export const Disabled = {
  args: {
    icon: MdArrowUpward,
    isDisabled: true,
  },
};
```

### Custom Size Icon

```jsx
export const CustomSize = {
  args: {
    icon: MdFavorite,
    size: 60,
    color: 'white',
    backgroundColor: '#8E12D5',
  },
};
```

## Accessibility

The `Icon` component is designed to be accessible, with appropriate ARIA attributes and keyboard interactions. When the `isDisabled` prop is set to `true`, the icon is not focusable and does not respond to clicks.

## Testing

The `Icon` component is tested using Storybook, ensuring that it renders correctly and behaves as expected under various conditions.

---

