# Test Files Documentation

**Automated Testing for AI Content Detector**

## Overview

The AI Content Detector includes two comprehensive test suites that verify different aspects of the system. These tests ensure the application works correctly and help identify issues during development.

---

## test_model.py - Model Functionality Tests

**Purpose**: Tests the core AI detection model without API overhead

### What This Program Tests

1. **Model Loading**: Verifies the AI model loads correctly from disk
2. **Basic Predictions**: Tests single text analysis functionality  
3. **Confidence Calculations**: Validates probability and confidence scoring
4. **Batch Processing**: Tests multiple text analysis at once
5. **Edge Cases**: Handles empty text, very short/long text, special cases
6. **Consistency**: Ensures same input produces same output
7. **Classification Examples**: Tests known AI vs human text samples

### Key Test Categories

#### Core Functionality Tests
- **Basic Prediction**: Validates probability output format and ranges
- **Confidence Prediction**: Tests enhanced prediction with confidence levels
- **Batch Prediction**: Verifies multiple text processing
- **Consistency**: Ensures reproducible results

#### Edge Case Tests
- **Empty Text**: How model handles no input
- **Very Short Text**: Single word or character inputs
- **Very Long Text**: Texts exceeding model limits
- **Special Characters**: Non-standard text formats

#### Classification Tests
- **Known AI Text**: Technical/formal text likely to be AI-generated
- **Known Human Text**: Casual/personal text likely to be human-written

### Running Model Tests

```bash
# Direct execution
python tests/test_model.py

# Or from project root
python -m tests.test_model
```

### Expected Output
```
=== AI Detection Model Test Suite ===

Model loaded successfully in 2.34 seconds

pass: Basic prediction
pass: Confidence prediction  
pass: Batch prediction
pass: Consistency test

--- Edge Case Tests ---
pass: Empty text handling
pass: Very short text
pass: Very long text

--- Classification Tests ---
pass: Known AI text
pass: Known human text

=== Test Results ===
Passed: 9/9
Success Rate: 100.0%
All tests passed!
```

### What Each Test Validates

#### Basic Prediction Test
```python
def test_basic_prediction(self):
    result = self.model.predict("Test sentence")
    # Validates:
    # - Required keys present
    # - Probabilities sum to ~1
    # - Values in valid range (0-1)
```

#### Confidence Test
```python
def test_confidence_prediction(self):
    result = self.model.predict_with_confidence("Test sentence")
    # Validates:
    # - All expected keys present
    # - Prediction is 'human' or 'ai'
    # - Confidence level is valid category
```

#### Edge Case Examples
```python
# Empty text should return default values
result = model.predict("")
# Expected: {'human_probability': 0.5, 'ai_probability': 0.5}

# Very long text should be handled gracefully
long_text = "word " * 1000
result = model.predict(long_text)
# Should not crash, returns valid probabilities
```

---

## test_api_func.py - API Endpoint Tests

**Purpose**: Tests all REST API endpoints and functionality

### What This Program Tests

1. **Authentication**: API key validation and security
2. **Text Analysis**: Core AI detection functionality via API
3. **File Uploads**: PDF, DOCX, TXT file processing
4. **Session Management**: User session creation and persistence
5. **History Operations**: Analysis storage and retrieval
6. **Error Handling**: Invalid inputs and edge cases
7. **HTTP Compliance**: Proper status codes and responses

### Test Categories

#### Authentication Tests
- API key requirement verification
- Valid vs invalid key handling
- Public vs protected endpoint access

#### Core Analysis Tests
- Valid text analysis
- Empty/short text rejection
- File upload processing
- Analysis result format validation

#### Session Tests
- Session creation and tracking
- Analysis history storage
- Individual analysis retrieval
- History clearing functionality

#### Error Handling Tests
- Invalid endpoints (404 responses)
- Wrong HTTP methods (405 responses)
- Malformed requests (400 responses)
- File size/type restrictions

### Running API Tests

```bash
# Ensure server is running first
python run.py

# In another terminal, run tests
python tests/test_api_func.py
```

### Expected Output
```
=== API Functionality Test ===

passed: Health endpoint requires API key
passed: Health endpoint with API key
passed: Session endpoint
passed: Text analysis with valid text
passed: Text analysis with empty text
passed: Text analysis with very short text
passed: Text analysis with force_single_analysis
passed: History endpoint
passed: Specific analysis retrieval
passed: Analysis retrieval with invalid ID
passed: Clear history
passed: Verify history clearance
passed: Very long text rejection
passed: Form data submission
passed: Invalid endpoint handling
passed: Wrong HTTP method handling

Result: 16/16 passed
Success Rate: 100.0%
All tests passed!
```

### Key Test Examples

#### Authentication Test
```python
# Test without API key (should fail)
response = requests.get("http://localhost:5000/api/health")
assert response.status_code == 401

# Test with valid API key (should succeed)
headers = {"X-API-Key": "jackboys25"}
response = requests.get("http://localhost:5000/api/health", headers=headers)
assert response.status_code == 200
```

#### Text Analysis Test
```python
payload = {"text": "This is a test sentence for analysis."}
response = session.post("/api/detect", json=payload)
assert response.status_code == 200
data = response.json()
assert data.get('success') == True
assert 'analysis_id' in data
```

#### Session Tracking Test
```python
# Tests maintain session across requests
session = requests.Session()
session.headers.update({"X-API-Key": "jackboys25"})

# All requests use same session
response1 = session.post("/api/detect", json={"text": "First analysis"})
response2 = session.get("/api/history")

# Should show analysis from first request
history = response2.json()
assert history['total_analyses'] >= 1
```

### Prerequisites for API Tests

1. **Server Running**: Flask app must be running on localhost:5000
2. **Redis Available**: Session storage needs Redis (or fallback will be used)
3. **Model Files**: AI detection model must be properly installed
4. **Network Access**: Tests make HTTP requests to localhost

---

## Running Both Test Suites

### Individual Tests
```bash
# Test just the model
python tests/test_model.py

# Test just the API (requires server running)
python tests/test_api_func.py
```

### Comprehensive Testing Strategy

1. **Start with Model Tests**: Verify core functionality works
2. **Then API Tests**: Ensure web interface works correctly
3. **Check All Pass**: Both suites should achieve 100% pass rate

### Test Configuration

#### Model Test Settings
```python
# Located in test_model.py
class ModelTester:
    def __init__(self):
        self.passed = 0
        self.total = 0
        self.model = None  # AI model instance
```

#### API Test Settings  
```python
# Located in test_api_func.py
BASE_URL = "http://localhost:5000"
API_KEY = "jackboys25"
```

---

## Interpreting Test Results

### Success Indicators
- **All Tests Pass**: Green "passed" messages
- **100% Success Rate**: No failures in test summary
- **Expected Outputs**: Reasonable AI/human probabilities
- **Proper Error Handling**: Invalid inputs rejected appropriately

### Common Issues

#### Model Test Failures
```
FAILED: Basic prediction
  Missing key: confidence
```
**Solution**: Check model loading and output format

#### API Test Failures
```
FAILED: Text analysis with valid text
  Status: 500, Response: Internal server error
```
**Solution**: Check server logs, verify model is loaded

#### Connection Failures
```
FAILED: Health endpoint with API key - Exception: Connection refused
```
**Solution**: Ensure Flask server is running on port 5000

---

## Development Workflow

### Adding New Tests

#### For Model Tests
```python
def test_new_functionality(self):
    """Test description"""
    result = self.model.your_new_method()
    # Add assertions
    return validation_result
```

#### For API Tests
```python
def test_new_endpoint():
    response = session.post("/api/new-endpoint", json=data)
    return response.status_code == 200
```

### Continuous Testing
- Run model tests after any changes to `model.py` or `text_analyser.py`
- Run API tests after changes to `app.py` or service layer
- Both test suites should pass before code commits

### Test-Driven Development
1. Write test for new functionality
2. Run test (should fail initially)
3. Implement functionality
4. Run test again (should pass)
5. Refactor if needed while keeping tests passing

---

## Troubleshooting Tests

### Model Test Issues

#### "Model directory not found"
```
Model directory not found!
Searched in the following locations:
  ./ai_detector_model
  ../ai_detector_model
```
**Solution**: 
- Download model files to project root
- Ensure directory is named exactly `ai_detector_model`
- Check working directory when running tests

#### "Error importing model"
```
Error importing model: No module named 'transformers'
```
**Solution**:
- Install missing dependencies: `pip install transformers torch`
- Activate virtual environment
- Verify all requirements are installed

#### Model Loading Timeouts
```
Model loaded successfully in 15.67 seconds
```
**If too slow**:
- Check available RAM (model needs ~2GB)
- Close other applications
- Consider SSD vs HDD storage speed

### API Test Issues

#### Connection Refused
```
FAILED Health endpoint with API key ...Exception: Connection refused
```
**Solution**:
- Start Flask server: `python run.py`
- Verify server is running on port 5000
- Check firewall settings

#### Redis Connection Failures
```
WARNING: Redis connection failed. Sessions will not be persisted.
```
**Impact**: API tests may still pass, but session tests might fail
**Solution**:
- Start Redis: `redis-server` or `sudo systemctl start redis-server`
- Verify Redis: `redis-cli ping` should return `PONG`

#### Authentication Failures
```
FAILED: Health endpoint requires API key
  Status: 200 (expected 401)
```
**Possible Cause**: Some endpoints might allow public access
**Solution**: Check if this is expected behavior or security issue

#### Analysis Retrieval Issues
```
FAILED: Specific analysis retrieval
  Status code: 404, Response: Analysis not found
```
**Debugging**:
- Check Redis contains session data: `redis-cli keys session:*`
- Verify analysis_id is correctly stored and retrieved
- Add delays between store and retrieve operations

### General Debugging Tips

#### Enable Debug Mode
```python
# In run.py, set debug=True
app.run(debug=True, host='0.0.0.0', port=5000)
```

#### Check Server Logs
Monitor Flask output for error details:
```
INFO:werkzeug:127.0.0.1 - - [timestamp] "POST /api/detect HTTP/1.1" 200
ERROR:root:Analysis failed: Model not loaded
```

#### Manual API Testing
Test endpoints manually with curl:
```bash
# Health check
curl -H "X-API-Key: jackboys25" http://localhost:5000/api/health

# Text analysis
curl -X POST -H "X-API-Key: jackboys25" -H "Content-Type: application/json" \
  -d '{"text":"Test sentence"}' http://localhost:5000/api/detect
```

#### Redis Debugging
```bash
# Connect to Redis CLI
redis-cli

# List all keys
KEYS *

# Get session data
GET session:your-session-id

# Monitor Redis operations
MONITOR
```

---

## Utility Scripts Documentation

### install_quick.ps1 - Windows Setup Script

**Purpose**: Automated setup for Windows development environment

#### What It Does
1. **Creates Python Virtual Environment**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

2. **Installs Redis in WSL**
   ```powershell
   wsl -e bash -c "redis-cli ping || (sudo apt install -y redis-server && sudo systemctl start redis-server)"
   ```

3. **Installs Python Dependencies**
   ```powershell
   pip install torch --index-url https://download.pytorch.org/whl/cpu
   pip install transformers flask flask-cors PyPDF2 python-docx werkzeug redis
   ```

#### Usage
```powershell
# Run from PowerShell in project directory
.\install_quick.ps1
```

#### Prerequisites
- Windows 10/11 with WSL enabled
- Python 3.8+ installed
- PowerShell execution policy allows scripts
- Internet connection for package downloads


### start.ps1 - Windows Start Script

**Purpose**: Quick startup for development environment

#### What It Does
1. **Starts Redis in WSL**
   ```powershell
   wsl -e bash -c "sudo systemctl start redis-server"
   ```

2. **Activates Virtual Environment**
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

3. **Runs Flask Application**
   ```powershell
   python run.py
   ```

#### Usage
```powershell
# Start everything at once
.\start.ps1
```

#### Benefits
- One-command startup
- Ensures Redis is running
- Activates correct Python environment
- Starts Flask server automatically

### run.py - Application Entry Point

**Purpose**: Main entry point that starts the Flask web server

#### What It Does
1. **Imports Flask App**
   ```python
   from api.app import app
   ```

2. **Checks Redis Connection**
   ```python
   if not redis_manager.is_connected():
       print("WARNING: Redis connection failed. Sessions will not be persisted.")
   ```

3. **Starts Development Server**
   ```python
   app.run(debug=True, host='0.0.0.0', port=5000)
   ```

#### Configuration Options
```python
# Development settings
app.run(debug=True, host='0.0.0.0', port=5000)

# Production settings (example)
app.run(debug=False, host='127.0.0.1', port=5000)
```

#### Parameters Explained
- **debug=True**: Enables hot reload and detailed error pages
- **host='0.0.0.0'**: Allows external connections (useful for testing from other devices)
- **port=5000**: Default Flask development port

#### Usage
```bash
# Direct execution
python run.py

# Or with explicit path
python /path/to/aicd-backend/run.py
```

---

## Best Practices for Testing

### Pre-Test Checklist
- [ ] Virtual environment activated
- [ ] All dependencies installed
- [ ] Redis server running (for API tests)
- [ ] Model files present in correct location
- [ ] No other services using port 5000

### Test Execution Order
1. **Model Tests First**: Verify core functionality
2. **Start Flask Server**: Required for API tests
3. **API Tests Second**: Test web interface
4. **Review Results**: Address any failures


### Performance Testing
Monitor test execution times:
- Model tests should complete in under 30 seconds
- API tests should complete in under 60 seconds
- Individual predictions should be under 1 second

### Test Coverage Goals
- All core functionality tested
- Edge cases covered
- Error conditions validated
- Integration points verified
- Performance within acceptable ranges