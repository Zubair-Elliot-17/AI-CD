
---

# HistoryPage Component Documentation

## Overview

The `HistoryPage` component is the main interface for viewing and managing the history of AI content analyses. It provides a list of previous analyses, each represented by a `HistoryTab` component, and allows users to view detailed results of a selected analysis using the `AnalysisHistory` component. The page includes controls for clearing the history and navigating back to the AI Text Detector page.

## Properties

The `HistoryPage` component does not accept any properties. It is a standalone component designed to provide a consistent user experience.

## Functions

### `loadHistory()`

- **Description**: Loads the analysis history from the API.
- **Behavior**: Fetches the list of past analyses, sorts them from newest to oldest, and updates the state with the sorted list. Displays a loading spinner while fetching and handles any errors that occur.

### `clearHistory()`

- **Description**: Clears all history entries.
- **Behavior**: Prompts the user for confirmation before clearing the history. If confirmed, it calls the API to clear the history and updates the state to reflect the empty list.

### `handleTabClick(analysis)`

- **Description**: Handles the click event on a history tab.
- **Parameters**:
  - `analysis`: The analysis object associated with the clicked tab.
- **Behavior**: Sets the selected analysis in the state and toggles the detailed view.

### `handlePanelSelect(button)`

- **Description**: Handles the selection of a panel button.
- **Parameters**:
  - `button`: The button that was clicked.
- **Behavior**: Navigates to the AI Text Detector page if the "AI Text Detector" button is clicked.

### `handleLogoClick()`

- **Description**: Handles the click event on the logo.
- **Behavior**: Navigates to the homepage.

## Usage

### Basic HistoryPage

```jsx
import HistoryPage from './HistoryPage';

<HistoryPage />
```

## CSS Styling

The `HistoryPage` component uses the following CSS classes:

- `.history-page`: The main container for the page.
- `.main-content`: The content area below the header.
- `.content-area`: The main content area.
- `.history-container-full`: The container for the history list.
- `.history-controls`: The controls at the top (clear history button).
- `.history-list`: The scrollable list of history items.
- `.loading-indicator`: The loading spinner.
- `.empty-state`: The empty state when no analyses.
- `.error-message`: The error message styling.

## How It Uses `HistoryTab`

The `HistoryPage` component uses the `HistoryTab` component to display each analysis in the history list. Each `HistoryTab` represents a single analysis result and includes key information such as the type of analysis, a preview of the text or filename, the AI probability score, and the classification result. The `HistoryTab` components are rendered inside the `history-list` container.

```jsx
<div className="history-list">
  {analyses.map(function(analysis, index) {
    return (
      <HistoryTab
        key={analysis.id || index} // Use ID or index as unique key
        analysis={analysis}
        onClick={handleTabClick}
        isSelected={selectedAnalysis?.id === analysis.id}
      />
    );
  })}
</div>
```

## How It Uses `AnalysisHistory`

The `HistoryPage` component uses the `AnalysisHistory` component to display detailed results of a selected analysis. When a `HistoryTab` is clicked, the `AnalysisHistory` component is rendered to show the full details of the selected analysis. The `AnalysisHistory` component receives the selected analysis object and a callback function to navigate back to the history list.

```jsx
{showAnalysisDetail ? (
  <AnalysisHistory 
    analysis={selectedAnalysis}
    onBack={() => {
      setShowAnalysisDetail(false);
      setSelectedAnalysis(null);
    }}
  />
) : (
  // Show list of history items
  <div className="history-container-full">
    ...
  </div>
)}
```

## Storybook Examples

### Default HistoryPage

```jsx
export const Default = {
  args: {},
};
```

## Accessibility

The `HistoryPage` component is designed to be accessible, with appropriate ARIA attributes and keyboard interactions. The buttons and tabs are focusable and respond to clicks.

## Testing

The `HistoryPage` component is tested using Storybook, ensuring that it renders correctly and behaves as expected under various conditions.

---
