import React from 'react';
import HistoryTab from './HistoryTab';

// Storybook configuration
export default {
  title: 'Pages/HistoryTab', // Where the story appears in Storybook
  component: HistoryTab,     // The component being tested
  parameters: {
    layout: 'centered',      // Center the component in the preview
  },
  argTypes: {
    onClick: { action: 'clicked' },  // Log clicks in Storybook actions
    isSelected: { control: 'boolean' }, // Add checkbox to toggle selection
  },
  tags: ['autodocs'], // Auto-generate documentation
};

// Boilerplate Template function used by all stories
// args are the props passed to the component
const Template = (args) => <HistoryTab {...args} />;

// Story 1: Text analysis that was classified as AI-generated
export const TextAnalysis = Template.bind({});
TextAnalysis.args = {
  analysis: {
    id: '1',
    text_preview: 'This is a sample text that was analyzed for AI content.',
    timestamp: new Date().toISOString(), // Current time
    text_length: 150,
    source_type: 'text',
    analysis_type: 'single_text',
    result: {
      ai_probability: 0.85,    // 85% chance it's AI
      human_probability: 0.15, // 15% chance it's human
      confidence: 0.92,        // Model is 92% confident
      classification: 'AI-generated'
    }
  },
  isSelected: false,
};

// Story 2: File analysis that was classified as human-written
export const FileAnalysis = Template.bind({});
FileAnalysis.args = {
  analysis: {
    id: '2',
    text_preview: 'Document content analysis showing human writing patterns...',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    text_length: 200,
    source_type: 'file',
    filename: 'document.pdf',  // Shows filename instead of text preview
    analysis_type: 'sentence_level',
    overall_result: {
      overall_ai_probability: 0.35,    // 35% AI probability
      overall_human_probability: 0.65, // 65% human probability
      overall_confidence: 0.78,
      overall_classification: 'Human-written'
    }
  },
  isSelected: true, // This one appears as selected
};
