
---

# AnalysisHistory Component Documentation

## Overview

The `AnalysisHistory` component displays the detailed results of a selected analysis from the history list. It provides a comprehensive view of the analysis, including the full text content, AI probability score, confidence level, and other relevant metadata. The component is designed to be interactive, allowing users to navigate back to the history list.

## Properties

The `AnalysisHistory` component accepts the following properties:

- **analysis**: An object containing the analysis results and metadata.
- **onBack**: A callback function to be called when the user clicks the back button.

## Functions

### `getAIScore()`

- **Description**: Calculates the AI probability score as a percentage.
- **Returns**: The AI probability score as a number.

### `getConfidenceScore()`

- **Description**: Calculates the confidence level as a percentage.
- **Returns**: The confidence level as a number.

### `formatDate(timestamp)`

- **Description**: Converts a timestamp to a readable date format.
- **Parameters**:
  - `timestamp`: The timestamp to convert.
- **Returns**: A string representing the formatted date.

### `getFullText()`

- **Description**: Gets the full text to display in the highlighted text component.
- **Returns**: A string representing the full text content.

## Usage

### Basic AnalysisHistory

```jsx
import AnalysisHistory from './AnalysisHistory';

const analysisData = {
  id: 'test-123',
  text_preview: 'This is a sample text preview...',
  timestamp: '2025-09-17T15:34:50.000Z',
  filename: 'sample.docx',
  analysis_type: 'sentence_level',
  source_type: 'file',
  text_length: 542,
  overall_result: {
    overall_ai_probability: 0.85,
    overall_human_probability: 0.15,
    overall_confidence: 0.82,
    overall_classification: 'AI-generated',
    sentence_count: 3,
    analyzed_sentences: 3,
    ai_sentence_count: 2,
    human_sentence_count: 1,
    ai_percentage: 66.7,
    confidence_range: {
      min: 0.75,
      max: 0.92,
      std_dev: 0.08
    }
  },
  sentence_analysis: [
    {
      index: 0,
      sentence: 'This is the first sentence of the analysis.',
      sentence_length: 42,
      result: {
        ai_probability: 0.92,
        human_probability: 0.08,
        confidence: 0.92,
        classification: 'AI-generated'
      }
    },
    {
      index: 1,
      sentence: 'This sentence appears to be written by a human.',
      sentence_length: 48,
      result: {
        ai_probability: 0.15,
        human_probability: 0.85,
        confidence: 0.85,
        classification: 'Human-written'
      }
    },
    {
      index: 2,
      sentence: 'Another AI generated sentence with high probability.',
      sentence_length: 52,
      result: {
        ai_probability: 0.98,
        human_probability: 0.02,
        confidence: 0.98,
        classification: 'AI-generated'
      }
    }
  ]
};

<AnalysisHistory
  analysis={analysisData}
  onBack={() => console.log('Back clicked')}
/>
```

## CSS Styling

The `AnalysisHistory` component uses the following CSS classes:

- `.analysis-history`: The main container for the analysis details page.
- `.analysis-header`: The header with a back button and title.
- `.back-button`: The back button styling.
- `.no-analysis-selected`: The message when no analysis is selected.
- `.analysis-content`: The main content area with text on the left and metrics on the right.
- `.analysis-text-section`: The left column with highlighted text content.
- `.analysis-metrics-section`: The right column with metrics and analysis details.
- `.metric-card`: The card containing all metrics.
- `.metric-title`: The title for both metrics.
- `.metric-container`: The container for both circular metrics.
- `.confidence-metric`: The container for the confidence metric.
- `.metric-details`: The detailed information section at the bottom.

## Storybook Examples

### Default AnalysisHistory

```jsx
export const Default = Template.bind({});
Default.args = {
  analysis: mockAnalysis,
  onBack: () => console.log('Back clicked')
};
```

### Single Text Analysis

```jsx
export const SingleTextAnalysis = Template.bind({});
SingleTextAnalysis.args = {
  analysis: mockSingleTextAnalysis,
  onBack: () => console.log('Back clicked')
};
```

### File Analysis

```jsx
export const FileAnalysis = Template.bind({});
FileAnalysis.args = {
  analysis: mockFileAnalysis,
  onBack: () => console.log('Back clicked')
};
```

### Mixed Results

```jsx
export const MixedResults = Template.bind({});
MixedResults.args = {
  analysis: {
    ...mockAnalysis,
    overall_result: {
      ...mockAnalysis.overall_result,
      overall_ai_probability: 0.55,
      overall_human_probability: 0.45,
      overall_confidence: 0.61,
      overall_classification: 'AI-generated',
      ai_sentence_count: 2,
      human_sentence_count: 2,
      ai_percentage: 50.0
    },
    sentence_analysis: [
      {
        index: 0,
        sentence: 'This sentence is clearly written by a human author.',
        sentence_length: 48,
        result: {
          ai_probability: 0.12,
          human_probability: 0.88,
          confidence: 0.88,
          classification: 'Human-written'
        }
      },
      {
        index: 1,
        sentence: 'The following content appears to be generated by artificial intelligence.',
        sentence_length: 72,
        result: {
          ai_probability: 0.89,
          human_probability: 0.11,
          confidence: 0.89,
          classification: 'AI-generated'
        }
      },
      {
        index: 2,
        sentence: 'Human creativity remains essential for original thought.',
        sentence_length: 52,
        result: {
          ai_probability: 0.23,
          human_probability: 0.77,
          confidence: 0.77,
          classification: 'Human-written'
        }
      },
      {
        index: 3,
        sentence: 'AI systems can efficiently process and generate large volumes of text.',
        sentence_length: 62,
        result: {
          ai_probability: 0.94,
          human_probability: 0.06,
          confidence: 0.94,
          classification: 'AI-generated'
        }
      }
    ]
  },
  onBack: () => console.log('Back clicked')
};
```

### High Confidence AI

```jsx
export const HighConfidenceAI = Template.bind({});
HighConfidenceAI.args = {
  analysis: {
    ...mockAnalysis,
    overall_result: {
      ...mockAnalysis.overall_result,
      overall_ai_probability: 0.97,
      overall_human_probability: 0.03,
      overall_confidence: 0.95,
      overall_classification: 'AI-generated',
      ai_sentence_count: 4,
      human_sentence_count: 0,
      ai_percentage: 100.0
    },
    sentence_analysis: [
      {
        index: 0,
        sentence: 'The utilization of advanced neural networks facilitates sophisticated pattern recognition.',
        sentence_length: 72,
        result: {
          ai_probability: 0.99,
          human_probability: 0.01,
          confidence: 0.99,
          classification: 'AI-generated'
        }
      },
      {
        index: 1,
        sentence: 'Algorithmic optimization enhances computational efficiency across diverse domains.',
        sentence_length: 68,
        result: {
          ai_probability: 0.98,
          human_probability: 0.02,
          confidence: 0.98,
          classification: 'AI-generated'
        }
      }
    ]
  },
  onBack: () => console.log('Back clicked')
};
```
## Testing

The `AnalysisHistory` component is tested using Storybook, ensuring that it renders correctly and behaves as expected under various conditions.

---