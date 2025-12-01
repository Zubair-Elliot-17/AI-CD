# model.py Documentation

**AI Detection Model Wrapper**

## What This Program Does

`model.py` is the "brain" of the AI detection system. It loads a pre-trained transformer model (Electra) and provides easy-to-use methods for determining whether text was written by AI or humans. Think of it as a translator that takes human text and returns probability scores.

## Key Responsibilities

1. **Model Loading**: Loads the pre-trained Electra transformer model from disk
2. **Text Tokenization**: Converts human text into numbers the AI model can understand
3. **Prediction Generation**: Runs the neural network to get raw AI vs human scores
4. **Probability Calculation**: Converts raw scores into understandable percentages
5. **Confidence Assessment**: Determines how confident the model is in its predictions
6. **Batch Processing**: Handles multiple texts at once for efficiency

## How It Works

### The AI Detection Process
1. **Input Text**: "This is a sample sentence"
2. **Tokenization**: [101, 2023, 2003, 1037, 7099, 6251, 102] (numbers the model understands)
3. **Neural Network Processing**: Complex mathematical operations
4. **Raw Output**: [1.2, -0.8] (logits for human vs AI)
5. **Probability Conversion**: Human: 85%, AI: 15%
6. **Confidence Score**: 85% (highest probability)

### Core Components

#### Model Initialization
```python
class AIDetectionModel:
    def __init__(self):
        # Load tokenizer and model from disk
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
        self.model = AutoModelForSequenceClassification.from_pretrained(self.model_path)
```

The model loads two main components:
- **Tokenizer**: Converts words to numbers (like a dictionary)
- **Neural Network**: The actual AI brain that makes predictions

#### Prediction Methods

**Basic Prediction** (`predict()`)
```python
result = model.predict("Hello world")
# Returns: {
#     'human_probability': 0.7234,
#     'ai_probability': 0.2766,
#     'confidence': 0.7234
# }
```

**Enhanced Prediction** (`predict_with_confidence()`)
```python
result = model.predict_with_confidence("Hello world")
# Returns: {
#     'prediction': 'human',
#     'confidence_level': 'Medium',
#     'confidence_score': 0.7234,
#     'human_probability': 0.7234,
#     'ai_probability': 0.2766
# }
```

**Batch Prediction** (`batch_predict()`)
```python
texts = ["Text 1", "Text 2", "Text 3"]
results = model.batch_predict(texts)
# Returns: [result1, result2, result3]
```

### Technical Implementation

#### Tokenization Process
The tokenizer converts text into model-readable format:
```
"Hello world" → [101, 7592, 2088, 102]
```
- 101: Special [CLS] token (start of sequence)
- 7592, 2088: Word tokens for "Hello" and "world"
- 102: Special [SEP] token (end of sequence)

#### Model Processing
```python
with torch.no_grad():  # Don't track gradients (we're not training)
    outputs = self.model(**inputs)
    logits = outputs.logits  # Raw neural network output
    probabilities = F.softmax(logits, dim=-1)  # Convert to percentages
```

#### Confidence Levels
The system converts numerical confidence to human-readable labels:
- **Very High**: 90%+ confidence
- **High**: 80-89% confidence  
- **Medium**: 70-79% confidence
- **Low**: 60-69% confidence
- **Very Low**: Below 60% confidence

## Configuration

### Model Path
```python
# Local development (relative to project root)
self.model_path = "../ai_detector_model"

# Production server (absolute path)
# self.model_path = "/home/ubuntu/aicd-backend/ai_detector_model"
```

### Processing Settings
- **Maximum sequence length**: 512 tokens (roughly 300-400 words)
- **Device**: CPU (can be changed to GPU for better performance)
- **Precision**: 4 decimal places for probabilities

## Model Architecture

### Transformer Model (Electra)
- **Type**: Electra (Efficiently Learning an Encoder that Classifies Token Replacements)
- **Task**: Binary sequence classification (AI vs Human)
- **Input**: Text sequences up to 512 tokens
- **Output**: Two logits (scores for human and AI classes)

### Why Electra?
- More efficient than BERT (faster training and inference)
- Good performance on text classification tasks
- Relatively small model size for deployment
- Pre-trained on large text corpora for language understanding

## Usage Examples

### Standalone Testing
```python
# Create model instance
detector = AIDetectionModel()

# Test a sentence
result = detector.predict_with_confidence("This text was written by an AI model.")
print(f"Classification: {result['prediction']}")
print(f"Confidence: {result['confidence_level']}")
```

### Integration with Web API
```python
# In app.py
text_analyser = TextAnalyser()  # Uses AIDetectionModel internally
result = text_analyser.analyse_text(user_text)
```

### Batch Processing
```python
# Analyze multiple texts at once
texts = [
    "First piece of text",
    "Second piece of text", 
    "Third piece of text"
]
results = detector.batch_predict(texts)

for i, result in enumerate(results):
    print(f"Text {i+1}: {result['confidence']:.3f} confidence")
```

## Performance Considerations

### Memory Usage
- Model size: ~400MB when loaded
- Each prediction uses minimal additional memory
- Batch processing is memory efficient

### Processing Speed
- Single prediction: ~100-500ms on CPU
- Batch predictions: More efficient than individual calls
- GPU acceleration can reduce time to ~50-100ms per prediction

### Optimization Tips
- Use batch processing for multiple texts
- Consider GPU deployment for high-volume usage
- Cache model instance (don't reload for each prediction)

## Error Handling

### Common Issues
1. **Model files missing**: Check if `ai_detector_model/` directory exists
2. **Out of memory**: Reduce batch size or use shorter texts
3. **CUDA errors**: Ensure proper device configuration (CPU vs GPU)
4. **Tokenization errors**: Very long texts may be truncated

### Built-in Safeguards
- Automatic text truncation to 512 tokens
- Graceful handling of empty inputs
- Device compatibility checking

## Integration Points

### With Text Analyser
```python
# text_analyser.py uses this model
self.model = AIDetectionModel()
prediction = self.model.predict(sentence)
```

### With Flask API
```python
# Through TextAnalyser in app.py
analysis_result = text_analyser.analyse_text(text)
```

### Direct Usage
```python
# For testing or batch processing
from services.model import AIDetectionModel
detector = AIDetectionModel()
result = detector.predict("Test text")
```

## Development Notes

### Adding New Models
To use a different model:
1. Replace files in `ai_detector_model/` directory
2. Update `model_path` if needed
3. Verify model is compatible with `AutoModelForSequenceClassification`
4. Test with known samples

### Confidence Threshold Tuning
Adjust confidence levels by modifying thresholds:
```python
if confidence_score >= 0.9:
    confidence_level = "Very High"
elif confidence_score >= 0.8:
    confidence_level = "High"
# etc.
```

### GPU Configuration
For GPU usage:
```python
self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
```

## Troubleshooting

### Model Won't Load
- Verify `ai_detector_model/` directory exists
- Check required files: `config.json`, `pytorch_model.bin`, tokenizer files
- Ensure sufficient RAM (2GB+ recommended)

### Poor Accuracy
- Very short texts (under 20 words) are less reliable
- Mixed languages may cause issues
- Ensure text is properly formatted (complete sentences)

### Performance Issues
- Consider GPU deployment for faster inference
- Use batch processing for multiple texts
- Monitor memory usage with large texts

### Integration Problems
- Check Python path includes project root
- Verify all dependencies are installed
- Test model independently with `python services/model.py`

## Testing

The model includes built-in testing when run directly:
```bash
python services/model.py
```

This will:
- Load the model
- Test with sample sentences
- Display detailed results
- Run batch processing tests
- Show confidence levels and probabilities