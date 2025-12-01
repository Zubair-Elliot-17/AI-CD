# AI Content Detector (AICD) Backend

**CSC3003S Capstone Project - 2025**  
**Team: JackBoys**  
**Members:** Zubair Elliot (ELLZUB001), Mubashir Dawood (DWDMUB001), Meekaaeel Booley (BLYMEE001)

A Flask-based REST API that uses machine learning to detect AI-generated vs human-written text. The system provides both single-text analysis and intelligent sentence-level analysis for longer documents.

## Features

- **AI Detection**: Pre-trained Electra transformer model for high-accuracy text classification
- **File Support**: PDF, DOCX, and TXT file processing with automatic text extraction
- **Sentence-Level Analysis**: Intelligent splitting and analysis of longer texts for better accuracy
- **Session Management**: Redis-based persistent storage of analysis history
- **Comprehensive API**: RESTful endpoints with proper authentication and error handling
- **Batch Processing**: Support for analyzing multiple texts or sentences simultaneously

## Technology Stack

- **Backend**: Flask (Python 3.8+)
- **AI Model**: Electra transformer (via Hugging Face Transformers)
- **Database**: Redis for session storage
- **File Processing**: PyPDF2 (PDF), python-docx (Word), custom text handlers
- **Authentication**: API key-based authentication
- **CORS**: Configured for frontend communication

## Project Structure

```
aicd-backend/
|- api/
|  |- app.py                 # Main Flask application with API endpoints
|- services/
|  |- __init__.py            # Package initialization
|  |- model.py               # AI detection model wrapper
|  |- text_analyser.py       # Text processing and analysis logic
|  |- file_processor.py      # File upload and text extraction
|  |- redis_manager.py       # Redis session management
|- tests/
|  |- test_model.py          # Model functionality tests
|  |- test_api_func.py       # API endpoint tests
|- ai_detector_model/        # Pre-trained model files (not in repo)
|- install_quick.ps1         # Windows setup script
|- start.ps1                 # Windows start script
|- run.py                    # Application entry point
|- Documentation/            # .docs.md files for each program
|- README.md                 # This file
```

## Installation

### Prerequisites

- Python 3.8 or higher
- Redis server (for session storage)
- Virtual environment (recommended)

### Quick Setup (Windows PowerShell)

```powershell
# Run the automated setup script
.\install_quick.ps1
```

This script will:
1. Create a Python virtual environment
2. Install Redis in WSL (if needed)
3. Install all required Python packages
4. Start Redis server

### Manual Setup

1. **Clone the repository and set up virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install Python dependencies:**
```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install transformers flask flask-cors PyPDF2 python-docx werkzeug redis
```

3. **Install and start Redis:**
```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server

# macOS
brew install redis
brew services start redis

# Windows (WSL recommended)
wsl -e bash -c "sudo apt install -y redis-server && sudo systemctl start redis-server"
```

4. **Download the AI model:**
Place the pre-trained model files in `ai_detector_model/` directory at the project root.

## Running the Application

### Quick Start (Windows)
```powershell
.\start.ps1
```

### Manual Start
```bash
# Activate virtual environment
source venv/bin/activate  # Windows: venv\Scripts\activate

# Start Redis (if not running)
redis-server  # Or: sudo systemctl start redis-server

# Run the application
python run.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

All endpoints require an API key sent as `X-API-Key` header or `api_key` query parameter.

**Default API Key:** `jackboys25`

### Core Endpoints

#### Health Check
```http
GET /api/health
```
Returns API status and configuration information.

#### Text Analysis
```http
POST /api/detect
Content-Type: application/json
X-API-Key: jackboys25

{
    "text": "Your text to analyze here",
    "force_single_analysis": false
}
```

#### File Upload Analysis
```http
POST /api/detect
Content-Type: multipart/form-data
X-API-Key: jackboys25

file: [PDF/DOCX/TXT file]
```

#### Session Management
```http
GET /api/session           # Get session info
GET /api/history          # Get analysis history
GET /api/analysis/{id}    # Get specific analysis
DELETE /api/clear-history # Clear session history
```

### Response Format

#### Single Text Analysis
```json
{
    "success": true,
    "analysis_id": "uuid-here",
    "analysis_type": "single_text",
    "result": {
        "ai_probability": 0.8234,
        "human_probability": 0.1766,
        "confidence": 0.8234,
        "classification": "AI-generated",
        "text_length": 150,
        "source_type": "text"
    }
}
```

#### Sentence-Level Analysis
```json
{
    "success": true,
    "analysis_id": "uuid-here",
    "analysis_type": "sentence_level",
    "result": {
        "overall_ai_probability": 0.7456,
        "overall_human_probability": 0.2544,
        "overall_confidence": 0.8123,
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
            "sentence_preview": "First sentence preview...",
            "result": {
                "ai_probability": 0.9234,
                "human_probability": 0.0766,
                "confidence": 0.9234,
                "classification": "AI-generated"
            }
        }
    ]
}
```

## Configuration

### File Upload Limits
- **Maximum file size:** 500KB
- **Supported formats:** PDF, DOCX, TXT
- **Text length limit:** 100,000 characters

### Model Configuration
- **Model type:** Electra transformer
- **Maximum sequence length:** 512 tokens
- **Device:** CPU (configurable for GPU)
- **Confidence levels:** Very Low, Low, Medium, High, Very High

### Redis Configuration
- **Host:** localhost
- **Port:** 6379
- **Database:** 0
- **Session persistence:** No expiration (academic use)

## Testing

### Model Tests
```bash
python tests/test_model.py
```
Tests core AI detection functionality including:
- Basic prediction accuracy
- Confidence calculation
- Batch processing
- Edge cases (empty text, very long text)
- Consistency checks

### API Tests
```bash
python tests/test_api_func.py
```
Tests all API endpoints including:
- Authentication
- Text analysis
- File upload
- Session management
- Error handling

## Architecture

### Analysis Pipeline

1. **Input Validation**: Check text length, file format, security
2. **Text Extraction**: Extract text from uploaded files
3. **Sentence Detection**: Smart splitting for multi-sentence texts
4. **AI Classification**: Run transformer model on each sentence
5. **Result Aggregation**: Combine sentence-level results
6. **Session Storage**: Save analysis to Redis with unique ID
7. **Response Generation**: Return structured JSON response

### Sentence-Level Analysis

For texts with multiple sentences, the system:
- Uses regex-based sentence splitting (handles abbreviations like "Dr.")
- Analyzes each sentence independently
- Calculates weighted averages for overall scores
- Provides detailed per-sentence breakdown
- Handles mixed AI/human content accurately

### Session Management

- Each user gets a unique session ID (UUID)
- All analyses stored persistently in Redis
- Session data includes full text, timestamps, and results
- Fallback to in-memory storage if Redis unavailable
- API provides history and individual analysis retrieval

## Development

### Adding New File Types
1. Update `ALLOWED_EXTENSIONS` in `FileProcessor`
2. Add extraction method in `file_processor.py`
3. Update file type routing in `process_file()`

### Model Customization
1. Replace model files in `ai_detector_model/`
2. Update model path in `model.py`
3. Adjust confidence thresholds if needed
4. Test with `python services/model.py`

### API Extensions
1. Add new endpoints in `app.py`
2. Use `@require_api_key` decorator for authentication
3. Use `@ensure_session` for session-dependent endpoints
4. Follow existing error handling patterns

## Production Deployment

### Security Considerations
- Change default API keys
- Use environment variables for secrets
- Enable HTTPS (set `SESSION_COOKIE_SECURE=True`)
- Configure proper CORS origins
- Add rate limiting
- Implement proper logging

### Performance Optimization
- Use GPU for model inference
- Add caching for repeated analyses
- Implement connection pooling for Redis
- Add request queuing for high loads
- Consider model quantization

### Monitoring
- Add health check endpoints
- Implement metrics collection
- Monitor Redis memory usage
- Track analysis accuracy over time
- Log performance bottlenecks

## Troubleshooting

### Common Issues

**Model loading fails:**
- Ensure `ai_detector_model/` directory exists with all required files
- Check Python path and working directory
- Verify sufficient RAM for model loading

**Redis connection fails:**
- Start Redis server: `redis-server` or `sudo systemctl start redis-server`
- Check Redis is running: `redis-cli ping`
- Application will fall back to in-memory storage

**File upload errors:**
- Check file size under 500KB limit
- Verify file format is PDF, DOCX, or TXT
- Ensure sufficient disk space for temporary files

**Analysis accuracy concerns:**
- Very short texts (under 50 characters) may be unreliable
- Mixed AI/human content benefits from sentence-level analysis
- Model works best with complete sentences and proper grammar

## License

This project is developed for academic purposes as part of CSC3003S coursework at the University of Cape Town.

## Support

For questions or issues, contact the development team:
- Zubair Elliot (ELLZUB001)
- Mubashir Dawood (DWDMUB001)
- Meekaaeel Booley (BLYMEE001)