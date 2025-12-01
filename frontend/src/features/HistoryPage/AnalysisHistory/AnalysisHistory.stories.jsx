import React from 'react';
import AnalysisHistory from './AnalysisHistory';

export default {
  title: 'Pages/AnalysisHistory',
  component: AnalysisHistory,
  tags: ['autodocs'], // Auto generate documentation
};

const mockAnalysis = {
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

const mockSingleTextAnalysis = {
  id: 'test-456',
  text_preview: 'This is a single text analysis sample...',
  timestamp: '2025-09-17T16:45:22.000Z',
  filename: null,
  analysis_type: 'single_text',
  source_type: 'text',
  text_length: 285,
  result: {
    ai_probability: 0.75,
    human_probability: 0.25,
    confidence: 0.75,
    classification: 'AI-generated',
    text_length: 285,
    source_type: 'text',
    filename: null
  },
  sentence_analysis: null
};

const mockFileAnalysis = {
  id: 'test-789',
  text_preview: 'This text was extracted from an uploaded file...',
  timestamp: '2025-09-17T17:12:33.000Z',
  filename: 'document.pdf',
  analysis_type: 'sentence_level',
  source_type: 'file',
  text_length: 876,
  overall_result: {
    overall_ai_probability: 0.42,
    overall_human_probability: 0.58,
    overall_confidence: 0.68,
    overall_classification: 'Human-written',
    sentence_count: 5,
    analyzed_sentences: 5,
    ai_sentence_count: 2,
    human_sentence_count: 3,
    ai_percentage: 40.0,
    confidence_range: {
      min: 0.62,
      max: 0.78,
      std_dev: 0.06
    }
  },
  sentence_analysis: [
    {
      index: 0,
      sentence: 'This document contains important information about the project.',
      sentence_length: 56,
      result: {
        ai_probability: 0.28,
        human_probability: 0.72,
        confidence: 0.72,
        classification: 'Human-written'
      }
    },
    {
      index: 1,
      sentence: 'The project timeline has been carefully planned and reviewed.',
      sentence_length: 54,
      result: {
        ai_probability: 0.35,
        human_probability: 0.65,
        confidence: 0.65,
        classification: 'Human-written'
      }
    },
    {
      index: 2,
      sentence: 'Implementation will proceed according to the established schedule.',
      sentence_length: 58,
      result: {
        ai_probability: 0.82,
        human_probability: 0.18,
        confidence: 0.82,
        classification: 'AI-generated'
      }
    },
    {
      index: 3,
      sentence: 'All team members are expected to contribute to the success of this initiative.',
      sentence_length: 68,
      result: {
        ai_probability: 0.45,
        human_probability: 0.55,
        confidence: 0.55,
        classification: 'Human-written'
      }
    },
    {
      index: 4,
      sentence: 'Regular progress reports will be generated and distributed to stakeholders.',
      sentence_length: 66,
      result: {
        ai_probability: 0.91,
        human_probability: 0.09,
        confidence: 0.91,
        classification: 'AI-generated'
      }
    }
  ]
};

const Template = (args) => <AnalysisHistory {...args} />;

export const Default = Template.bind({});
Default.args = {
  analysis: mockAnalysis,
  onBack: () => console.log('Back clicked')
};


export const SingleTextAnalysis = Template.bind({});
SingleTextAnalysis.args = {
  analysis: mockSingleTextAnalysis,
  onBack: () => console.log('Back clicked')
};

export const FileAnalysis = Template.bind({});
FileAnalysis.args = {
  analysis: mockFileAnalysis,
  onBack: () => console.log('Back clicked')
};

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

export const HighConfidenceHuman = Template.bind({});
HighConfidenceHuman.args = {
  analysis: {
    ...mockAnalysis,
    overall_result: {
      ...mockAnalysis.overall_result,
      overall_ai_probability: 0.08,
      overall_human_probability: 0.92,
      overall_confidence: 0.91,
      overall_classification: 'Human-written',
      ai_sentence_count: 0,
      human_sentence_count: 3,
      ai_percentage: 0.0
    },
    sentence_analysis: [
      {
        index: 0,
        sentence: 'I really enjoyed working on this project with my team members.',
        sentence_length: 52,
        result: {
          ai_probability: 0.05,
          human_probability: 0.95,
          confidence: 0.95,
          classification: 'Human-written'
        }
      },
      {
        index: 1,
        sentence: 'The challenges we faced helped us grow both individually and collectively.',
        sentence_length: 68,
        result: {
          ai_probability: 0.12,
          human_probability: 0.88,
          confidence: 0.88,
          classification: 'Human-written'
        }
      }
    ]
  },
  onBack: () => console.log('Back clicked')
};