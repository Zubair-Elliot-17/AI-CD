
---

# AITextDetectorPage Component Documentation

## Overview

The `AITextDetectorPage` component is the main page for the AI Text Detector feature of the application. It provides a user interface for submitting text or files for AI content detection, displaying the analysis results, and navigating to the history page. The page includes a text input area, a file attachment option, and metrics for displaying the AI probability and confidence scores.

## Properties

The `AITextDetectorPage` component does not accept any properties. It is a standalone component designed to provide a consistent user experience.

## Functions

### `handlePanelSelect(button)`

- **Description**: Handles the selection of a panel button.
- **Parameters**:
  - `button`: The button that was clicked.
- **Behavior**: If the "History" button is clicked, it navigates to the history page. Otherwise, it resets the state to its initial values.

### `handleTextSubmit(text, file)`

- **Description**: Handles the submission of text or a file for AI content detection.
- **Parameters**:
  - `text`: The text input by the user.
  - `file`: The file uploaded by the user.
- **Behavior**: Validates the input text and file size, then calls the appropriate API endpoint to perform the detection. Updates the state with the analysis results and refreshes the history data.

### `handleFileAttach(file)`

- **Description**: Handles the attachment of a file.
- **Parameters**:
  - `file`: The file uploaded by the user.
- **Behavior**: Sets the attached file in the state and clears any existing errors.

### `handleLogoClick()`

- **Description**: Handles the click event on the logo.
- **Behavior**: Resets the state to its initial values and navigates to the homepage.

### `refreshHistory()`

- **Description**: Refreshes the history data.
- **Behavior**: Calls the API to fetch the latest history data and logs the result.

### `getConfidenceDescription()`

- **Description**: Generates a description based on the AI probability score.
- **Behavior**: Returns a string describing the likelihood of AI-generated content based on the `aiScore`.

### `getConfidenceLevel()`

- **Description**: Generates a confidence level description.
- **Behavior**: Returns a string describing the confidence level based on the `confidenceScore`.

### `getSentencesForHighlighting()`

- **Description**: Prepares sentence data for highlighting.
- **Behavior**: Extracts sentence-level analysis results from the API response and formats them for display.

### `getTextForDisplay()`

- **Description**: Gets the text to display.
- **Behavior**: Returns the user-submitted text or the text preview from the API response.

## Usage

### Basic AITextDetectorPage

```jsx
import AITextDetectorPage from './AITextDetectorPage';

<AITextDetectorPage />
```

## CSS Styling

The `AITextDetectorPage` component uses the following CSS classes:

- `.ai-text-detector-page`: The main container for the page.
- `.main-content`: The content area below the header.
- `.panel-container`: The container for the navigation panel.
- `.content-area`: The main content area holding the text input and metrics.
- `.text-input-container`: The container for the text input section.
- `.metric-container`: The container for the metrics panel.
- `.metric-item`: The individual metric item styling.
- `.analysis-details`: The container for the analysis details.
- `.error-message`: The styling for error messages.
- `.processing-indicator`: The container for the loading spinner.
- `.text-content`: The container for the analysis text display area.
- `.sentence-highlight`: The styling for highlighted sentences.
- `.text-legend`: The container for the text highlighting legend.
- `.analysis-text`: The container for additional analysis text.

## Storybook Examples

### Default AITextDetectorPage

```jsx
export const Default = function() {
  return <AITextDetectorPage />;
};
```

## Accessibility

The `AITextDetectorPage` component is designed to be accessible, with appropriate ARIA attributes and keyboard interactions. The text input area and buttons are focusable and respond to clicks.

## Testing

The `AITextDetectorPage` component is tested using Storybook, ensuring that it renders correctly and behaves as expected under various conditions.

---

