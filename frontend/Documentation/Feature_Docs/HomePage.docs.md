
---

# HomePage Component Documentation

## Overview

The `HomePage` component is the main landing page of the application. It provides an introduction to the AI Content Detector (AI-CD) project, information about the team, and a call-to-action button to navigate to the AI text detector page. The page features a gradient background, a prominent logo, and a glass effect on the team description box.

## Properties

The `HomePage` component does not accept any properties. It is a standalone component designed to provide a consistent user experience.

## Usage

### Basic HomePage

```jsx
import HomePage from './HomePage';

<HomePage />
```

## CSS Styling

The `HomePage` component uses the following CSS classes:

- `.homepage`: The main container for the page with a gradient background.
- `.homepage-header`: The header at the top of the page.
- `.logo`: The large logo text at the top of the page.
- `.main-content`: The main content area of the page.
- `.cta-section`: The section containing the call-to-action button.
- `.team-description`: The box containing information about the team with a glass effect.
- `.description-content`: The content inside the team description box.

## Storybook Examples

### Default HomePage

```jsx
export const Default = {
  // No special parameters needed
};
```

## Accessibility

The `HomePage` component is designed to be accessible, with appropriate ARIA attributes and keyboard interactions. The call-to-action button is focusable and responds to clicks.

## Testing

The `HomePage` component is tested using Storybook, ensuring that it renders correctly and behaves as expected under various conditions.

---

