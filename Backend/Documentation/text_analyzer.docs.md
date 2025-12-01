# text_analyser.py Documentation

**Text Analysis Engine**

## What This Program Does

`text_analyser.py` is the "conductor" of the AI detection process. It coordinates all the complex steps needed to analyze text intelligently. The program decides whether to analyze text as a whole or split it into sentences for better accuracy, then combines all the results into meaningful insights.

## Key Responsibilities

1. **Smart Text Processing**: Decides the best way to analyze different types of text
2. **Sentence Splitting**: Uses intelligent rules to break text into individual sentences
3. **Analysis Coordination**: Manages the AI detection process for each piece of text
4. **Result Aggregation**: Combines individual sentence results into overall scores
5. **Security Validation**: Ensures input text is safe and within reasonable limits
6. **Statistics Calculation**: Provides detailed confidence metrics and distributions

## How It Works

### The Analysis Decision Process

The program automatically chooses the best analysis strategy:

**Short Text (1 sentence)**: Single analysis
- Faster processing
- Good for tweets, short messages
- Example: "Hello, how are you today?"

**Long Text (2+ sentences)**: Sentence-level analysis
- More accurate for mixed content
- Detailed breakdown per sentence
- Better for documents, articles, essays

### Two Analysis Strategies

#### Single Text Analysis
```
Input: "This is a short message."
↓
AI Model Analysis
↓
Output: 75% AI, 25% Human, High Confidence
```

#### Sentence-Level Analysis
```
Input: "First sentence here. Second sentence follows. Third sentence ends it."
↓
Split into: ["First sentence here", "Second sentence follows", "Third sentence ends it"]
↓
Analyze each: [80% AI, 60% AI, 90% Human]
↓
Aggregate: Overall 63% AI, 37% Human, Medium Confidence
```

## Core Components

### Text Validation
```python
def validate_input_length(self, text, max_length=None):
    word_count = len(text.split())
    if word_count < 10:
        return jsonify({
            'error': 'Text must be at least 10 words long'
        }), 400

    if len(text) > text_analyser.MAX_TEXT_LENGTH:
        return jsonify({
            'error': f'Text must be less than {text_analyser.MAX_TEXT_LENGTH:,} characters'
        }), 400
```

### Intelligent Sentence Splitting
```python
def split_into_sentences(self, text):
    # Smart regex that avoids splitting on abbreviations
    sentence_pattern = r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\!|\?)\s+'
    sentences = re.split(sentence_pattern, text.strip())
```

This handles tricky cases like:
- "Dr. Smith went to the U.S.A. He had a good time." → 2 sentences
- "Mr. Jones vs. Ms. Davis! What a match." → 2 sentences

### Statistical Analysis
```python
def calculate_overall_confidence(self, sentence_results):
    # Calculates mean, standard deviation, min/max confidence
    # Counts AI vs human sentences
    # Provides percentage breakdowns
```

## Main Methods

### `analyse_text()` - The Main Entry Point
This is the method that `app.py` calls. It:
1. Validates the input text
2. Decides between single or sentence-level analysis
3. Coordinates the AI detection process
4. Returns formatted results for both API and session storage

```python
result = analyser.analyse_text(
    text="Your text here",
    source_type='text',  # or 'file'
    filename=None,
    force_single_analysis=False
)
```

### `split_into_sentences()` - Smart Text Splitting
Breaks text into sentences while handling edge cases:
- Abbreviations: "Dr.", "Mr.", "U.S.A."
- Decimal numbers: "The price is $3.50"
- Multiple punctuation: "Really?! Yes!"

### `analyse_sentences()` - Multi-Sentence Processing
Processes each sentence through the AI model:
```python
sentences = ["Sentence 1", "Sentence 2", "Sentence 3"]
results = analyser.analyse_sentences(sentences)
# Returns detailed results for each sentence
```

### `calculate_overall_confidence()` - Result Aggregation
Combines individual sentence results:
- Averages probabilities across all sentences
- Counts how many sentences are classified as AI vs human
- Calculates confidence statistics (min, max, standard deviation)
- Handles error cases gracefully

## Output Formats

### Single Text Analysis Result
```json
{
    "analysis_type": "single_text",
    "result": {
        "ai_probability": 0.8234,
        "human_probability": 0.1766,
        "confidence": 0.8234,
        "classification": "AI-generated",
        "text_length": 150,
        "source_type": "text"
    },
    "session_data": {
        "result": {...},
        "analysis_type": "single_text"
    }
}
```

### Sentence-Level Analysis Result
```json
{
    "analysis_type": "sentence_level",
    "result": {
        "overall_ai_probability": 0.7456,
        "overall_human_probability": 0.2544,
        "overall_classification": "AI-generated",
        "sentence_count": 4,
        "analyzed_sentences": 4,
        "ai_sentence_count": 3,
        "human_sentence_count": 1,
        "ai_percentage": 75.0,
        "confidence_range": {
            "min": 0.6789,
            "max": 0.9234,
            "std_dev": 0.1023
        }
    },
    "sentence_results": [
        {
            "index": 0,
            "sentence": "First sentence text",
            "sentence_preview": "First sentence text",
            "result": {
                "ai_probability": 0.9234,
                "human_probability": 0.0766,
                "classification": "AI-generated"
            }
        }
    ]
}
```

## Configuration Settings

### Text Limits
```python
MIN_SENTENCE_LENGTH = 10      # Minimum characters per sentence
MAX_TEXT_LENGTH = 100000      # Maximum total text length
```

### Analysis Thresholds
- Sentences under 10 characters are filtered out (too short for reliable analysis)
- Texts over 100,000 characters are rejected (performance limits)
- Single sentence texts use single analysis mode
- Multi-sentence texts use sentence-level analysis (unless forced otherwise)

## Advanced Features

### Error Resilience
If one sentence fails analysis, others continue:
```python
try:
    prediction = self.model.predict(sentence)
    results.append({...})
except Exception as e:
    results.append({
        'index': idx,
        'sentence_preview': sentence[:100],
        'error': str(e)
    })
```

### Statistical Insights
The system provides detailed statistics:
- **Confidence Range**: Shows variability in predictions
- **Sentence Breakdown**: Counts and percentages of AI vs human sentences
- **Standard Deviation**: Indicates consistency of predictions

### Flexible Output
Returns data in two formats:
- **API Format**: Optimized for web responses
- **Session Format**: Optimized for database storage

## Usage Examples

### Basic Text Analysis
```python
analyser = TextAnalyser()
result = analyser.analyse_text("This is a test sentence for analysis.")
print(f"Classification: {result['result']['classification']}")
```

### File Content Analysis
```python
result = analyser.analyse_text(
    text=extracted_file_content,
    source_type='file',
    filename='document.pdf'
)
```

### Force Single Analysis
```python
result = analyser.analyse_text(
    text="Long text with multiple sentences. But analyze as single unit.",
    force_single_analysis=True
)
```

## Integration with Other Components

### With AI Model
```python
# TextAnalyser uses AIDetectionModel internally
self.model = AIDetectionModel()
prediction = self.model.predict(text)
```

### With Flask API
```python
# app.py uses TextAnalyser
text_analyser = TextAnalyser()
analysis_result = text_analyser.analyse_text(user_input)
```

### With File Processor
```python
# After file processing, text goes to analyser
text, filename = file_processor.process_file(uploaded_file)
result = text_analyser.analyse_text(text, source_type='file', filename=filename)
```

## Performance Considerations

### Processing Time
- Single analysis: ~100-500ms per text
- Sentence-level: ~100-500ms per sentence (sequential processing)
- Longer texts take proportionally more time

### Memory Usage
- Minimal memory overhead for text processing
- Main memory usage comes from the AI model
- Statistics calculations are lightweight

### Optimization Strategies
- Sentence filtering reduces unnecessary processing
- Error handling prevents cascade failures
- Batch operations within the AI model are efficient

## Error Handling

### Input Validation Errors
```python
# Too short
raise ValueError('Text must be at least 10 words long')

# Too long  
raise ValueError(f'Text exceeds maximum length of {max_length} characters')
```

### Analysis Errors
- Individual sentence failures don't stop the entire analysis
- Error details are logged for debugging
- Partial results are still returned when possible

### Security Checks
```python
def perform_security_checks(self, text):
    self.validate_input_length(text)
    # Additional security validations could be added here
    return text
```

## Development Notes

### Adding New Analysis Types
To add new analysis strategies:
1. Create new analysis method
2. Add decision logic in `analyse_text()`
3. Update result formatting
4. Add tests for the new functionality

### Modifying Sentence Splitting
The regex pattern can be adjusted for different languages or text types:
```python
# Current pattern handles English well
sentence_pattern = r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\!|\?)\s+'

# For other languages, modify the pattern
```

### Tuning Statistical Calculations
Adjust aggregation methods in `calculate_overall_confidence()`:
- Change from mean to weighted average
- Add different confidence metrics
- Modify classification thresholds

## Troubleshooting

### Common Issues

**Sentence splitting problems**
- Check regex pattern for edge cases
- Verify text doesn't have unusual punctuation
- Test with `split_into_sentences()` directly

**Poor aggregation results**
- Ensure individual sentence analyses are working
- Check for empty or error results in sentence_results
- Verify statistical calculations

**Performance issues**
- Consider reducing maximum text length
- Profile sentence-level vs single analysis usage
- Monitor AI model performance

### Testing Individual Components
```python
# Test sentence splitting
analyser = TextAnalyser()
sentences = analyser.split_into_sentences(your_text)
print(f"Found {len(sentences)} sentences")

# Test single sentence analysis
results = analyser.analyse_sentences(sentences)
print(f"Analyzed {len(results)} sentences")
```