# app.py Documentation

**Main Flask API Server**

## What This Program Does

`app.py` is the heart of the AI Content Detector backend. It's a Flask web server that provides REST API endpoints for detecting AI-generated text. Think of it as the "control center" that receives requests from users, processes them, and sends back results.

## Key Responsibilities

1. **Handles Web Requests**: Receives HTTP requests from frontend applications or direct API calls
2. **User Authentication**: Checks API keys to ensure only authorized users can access the service
3. **Text Analysis Coordination**: Takes user text/files and orchestrates the AI detection process
4. **Session Management**: Keeps track of user sessions and analysis history
5. **File Processing**: Handles uploaded PDF, DOCX, and TXT files
6. **Error Handling**: Provides meaningful error messages when things go wrong

## How It Works

### The Request Flow
1. User sends a request (text or file) to an API endpoint
2. Server checks if the API key is valid
3. Server processes the input (extracts text from files if needed)
4. Server runs AI detection analysis on the text
5. Server stores the results in the user's session
6. Server returns the analysis results as JSON

### Main Components

#### Authentication System
```python
@require_api_key
def protected_function():
    # Only runs if valid API key provided
```
- Uses decorator pattern to protect endpoints
- Checks for API key in headers or URL parameters
- Current API key: "jackboys25" (for demo purposes)

#### Session Management
```python
@ensure_session
def session_function():
    # Automatically creates/maintains user sessions
```
- Every user gets a unique session ID
- Sessions store all analysis history
- Uses Redis for persistence (falls back to memory if Redis fails)

#### Core Endpoints

**Health Check** (`/api/health`)
- Simple endpoint to verify the API is running
- Returns system status and configuration info
- No authentication required

**AI Detection** (`/api/detect`)
- Main endpoint for text analysis
- Accepts both raw text and file uploads
- Returns AI probability scores and detailed analysis
- Supports sentence-level analysis for longer texts

**History Management** 
- `/api/history` - Get user's analysis history
- `/api/analysis/{id}` - Get specific analysis by ID
- `/api/clear-history` - Delete all user's analyses

### Input Processing

#### Text Input
```json
{
    "text": "Your text here",
    "force_single_analysis": false
}
```

#### File Upload
- Supports PDF, DOCX, TXT files
- Maximum size: 500KB
- Automatically extracts text using specialized libraries

#### Analysis Types

**Single Text Analysis**: For short texts (1 sentence)
- Analyzes the entire text as one unit
- Faster processing
- Good for tweets, short messages

**Sentence-Level Analysis**: For longer texts (2+ sentences)
- Splits text into individual sentences
- Analyzes each sentence separately
- Combines results for overall score
- More accurate for mixed AI/human content

### Output Format

#### Successful Response
```json
{
    "success": true,
    "analysis_id": "unique-id-here",
    "analysis_type": "sentence_level",
    "result": {
        "overall_ai_probability": 0.75,
        "overall_human_probability": 0.25,
        "overall_confidence": 0.82,
        "classification": "AI-generated",
        "sentence_count": 3,
        "ai_sentence_count": 2,
        "human_sentence_count": 1
    }
}
```

#### Error Response
```json
{
    "error": "Text must be at least 10 words long"
}
```

## Configuration

### Security Settings
- API keys stored in `API_KEYS` set
- Session cookies configured for security
- CORS enabled for frontend communication

### File Upload Limits
- Maximum file size: 500KB
- Allowed formats: PDF, DOCX, TXT
- Maximum text length: 100,000 characters

### Redis Integration
- Primary storage for user sessions
- Falls back to in-memory storage if Redis unavailable
- No expiration on stored data (academic project)

## Error Handling

The application handles various error scenarios:

1. **Invalid API Key** (401): Missing or wrong authentication
2. **Bad Request** (400): Invalid input, empty text, unsupported files
3. **File Too Large** (413): Exceeds 500KB limit
4. **Not Found** (404): Invalid endpoints or analysis IDs
5. **Method Not Allowed** (405): Wrong HTTP method
6. **Internal Server Error** (500): Unexpected system errors

## Key Design Patterns

### Decorator Pattern
- `@require_api_key`: Adds authentication to endpoints
- `@ensure_session`: Manages user sessions automatically
- `@app.errorhandler`: Handles specific error types

### Service Layer Architecture
- Controllers (app.py) handle HTTP concerns
- Services (model.py, text_analyser.py) handle business logic
- Data layer (redis_manager.py) handles persistence

### Fallback Strategy
- Redis primary, in-memory fallback
- Graceful degradation if external services fail

## Dependencies

### Internal Services
- `FileProcessor`: Handles file uploads and text extraction
- `TextAnalyser`: Coordinates AI detection analysis
- `redis_manager`: Manages session persistence

### External Libraries
- `Flask`: Web framework for HTTP handling
- `flask-cors`: Cross-origin resource sharing
- `uuid`: Generates unique identifiers
- `datetime`: Timestamp management

## Usage Examples

### Starting the Server
```python
from api.app import app
app.run(debug=True, host='0.0.0.0', port=5000)
```

### Testing an Endpoint
```bash
curl -X POST http://localhost:5000/api/detect \
  -H "X-API-Key: jackboys25" \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a test sentence."}'
```

## Development Notes

### Adding New Endpoints
1. Define function with appropriate decorators
2. Handle input validation
3. Process business logic
4. Return consistent JSON format
5. Add error handling

### Security Considerations
- API keys should use environment variables in production
- HTTPS should be enabled for production
- Rate limiting should be implemented for public deployment
- Input sanitization is handled by the service layer

### Performance Considerations
- Each analysis involves AI model inference (CPU intensive)
- File uploads require temporary disk storage
- Redis operations are generally fast
- Sentence-level analysis is slower but more accurate

## Troubleshooting

**Common Issues:**
- Redis connection failures: Check if Redis server is running
- Model loading errors: Verify model files exist in correct location
- File upload errors: Check file size and format restrictions
- Authentication errors: Verify API key is correctly provided

**Debug Mode:**
- Set `debug=True` for detailed error messages
- Check server logs for detailed request/response information
- Use Redis CLI to inspect session data: `redis-cli keys session:*`