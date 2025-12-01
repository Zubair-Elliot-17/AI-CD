
---

# HistoryTab Component Documentation

## Overview

The `HistoryTab` component is a single item in the history list, displaying the results of a previous analysis. It provides a summary of the analysis, including the type of analysis, a preview of the text or filename, the AI probability score, and the classification result. The component is interactive, allowing users to click on it to view detailed results.

## Properties

The `HistoryTab` component accepts the following properties:

- **analysis**: An object containing the analysis results and metadata.
- **onClick**: A callback function to be called when the tab is clicked.
- **isSelected**: A boolean indicating whether the tab is currently selected. Default is `false`.

## Functions

### `formatDate(timestamp)`

- **Description**: Converts a timestamp to a readable date format.
- **Parameters**:
  - `timestamp`: The timestamp to convert.
- **Returns**: A string representing the formatted date.

### `getAIScore()`

- **Description**: Calculates the AI probability score as a percentage.
- **Returns**: The AI probability score as a number.

### `getPreviewText()`

- **Description**: Gets the text to display in the preview area.
- **Returns**: A string representing the preview text or filename.

### `getClassification()`

- **Description**: Determines if the content is AI-generated or human-written based on the AI score.
- **Returns**: A string indicating the classification ("AI-generated" or "Human-written").

## Usage

### Basic HistoryTab

```jsx
import HistoryTab from './HistoryTab';

const analysisData = {
  id: '1',
  text_preview: 'This is a sample text that was analyzed for AI content.',
  timestamp: new Date().toISOString(),
  text_length: 150,
  source_type: 'text',
  analysis_type: 'single_text',
  result: {
    ai_probability: 0.85,
    human_probability: 0.15,
    confidence: 0.92,
    classification: 'AI-generated'
  }
};

<HistoryTab
  analysis={analysisData}
  onClick={() => console.log('Tab clicked')}
  isSelected={false}
/>
```

## CSS Styling

The `HistoryTab` component uses the following CSS classes:

- `.history-tab`: The main container for each history item.
- `.tab-content`: The content layout inside the tab.
- `.tab-title`: The title styling.
- `.tab-preview`: The preview text styling.
- `.tab-meta`: The metadata row with score and date.
- `.tab-score`: The AI score badge styling.
- `.tab-date`: The date styling.
- `.tab-classification`: The classification badge styling.

## Storybook Examples

### Text Analysis

```jsx
export const TextAnalysis = Template.bind({});
TextAnalysis.args = {
  analysis: {
    id: '1',
    text_preview: 'This is a sample text that was analyzed for AI content.',
    timestamp: new Date().toISOString(),
    text_length: 150,
    source_type: 'text',
    analysis_type: 'single_text',
    result: {
      ai_probability: 0.85,
      human_probability: 0.15,
      confidence: 0.92,
      classification: 'AI-generated'
    }
  },
  isSelected: false,
};
```

### File Analysis

```jsx
export const FileAnalysis = Template.bind({});
FileAnalysis.args = {
  analysis: {
    id: '2',
    text_preview: 'Document content analysis showing human writing patterns...',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    text_length: 200,
    source_type: 'file',
    filename: 'document.pdf',
    analysis_type: 'sentence_level',
    overall_result: {
      overall_ai_probability: 0.35,
      overall_human_probability: 0.65,
      overall_confidence: 0.78,
      overall_classification: 'Human-written'
    }
  },
  isSelected: true,
};
```

## Accessibility

The `HistoryTab` component is designed to be accessible, with appropriate ARIA attributes and keyboard interactions. The tab is focusable and responds to clicks.

## Testing

The `HistoryTab` component is tested using Storybook, ensuring that it renders correctly and behaves as expected under various conditions.

---

