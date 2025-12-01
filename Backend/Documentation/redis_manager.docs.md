# redis_manager.py Documentation

**Session Data Storage and Management**

## What This Program Does

`redis_manager.py` manages all database operations for the AI Content Detector using Redis. It handles user sessions, stores analysis history, and provides a fallback system if Redis isn't available. Think of it as the "memory keeper" that remembers everything users have analyzed in the past.

## Key Responsibilities

1. **Session Storage**: Keeps track of individual user sessions and their analysis history
2. **Data Persistence**: Ensures user data survives server restarts
3. **JSON Serialization**: Converts Python objects to/from Redis-compatible format
4. **Connection Management**: Handles Redis connections with automatic fallback
5. **Error Handling**: Gracefully handles Redis failures without breaking the application

## How It Works

### Session Data Structure

Each user session is stored with this structure:
```python
session_data = {
    'created_at': datetime.datetime.now(),
    'analyses': [
        {
            'id': 'unique-analysis-id',
            'text_preview': 'Beginning of analyzed text...',
            'timestamp': datetime.datetime.now(),
            'text_length': 150,
            'source_type': 'text',  # or 'file'
            'filename': 'document.pdf',  # if from file
            'result': {...},  # AI analysis results
            'analysis_type': 'sentence_level'
        }
    ]
}
```

### Redis Key Structure
- **Session Keys**: `session:abc123` (where abc123 is the session ID)
- **Analysis Keys**: `analysis:def456` (for individual analyses)
- **Value Format**: JSON strings containing session/analysis data

## Core Components

### Connection Management
```python
class RedisManager:
    def __init__(self, host='localhost', port=6379, db=0):
        self.redis_client = None
        self.connected = False
        
        try:
            self.connect()
            self.connected = True
        except:
            print("Redis connection failed... using fallback storage")
            self.connected = False
```

### Data Serialization
Redis can only store strings, so we convert Python objects:
```python
# Storing data (Python dict → JSON string)
session_json = json.dumps(session_data)
self.redis_client.set(f"session:{session_id}", session_json)

# Retrieving data (JSON string → Python dict)
session_json = self.redis_client.get(f"session:{session_id}")
session_data = json.loads(session_json)
```

### DateTime Handling
Python datetime objects need special handling for JSON:
```python
# Before storing
if isinstance(session_data['created_at'], datetime.datetime):
    session_data['created_at'] = session_data['created_at'].isoformat()

# After retrieving
if 'created_at' in session_data:
    session_data['created_at'] = datetime.datetime.fromisoformat(session_data['created_at'])
```

## Main Methods

### `store_session()` - Save Session Data
```python
success = redis_manager.store_session(session_id, session_data)
```

**What it does:**
- Converts datetime objects to strings
- Serializes data to JSON
- Stores in Redis with session key
- No expiration (data persists indefinitely)
- Returns True/False for success

### `get_session()` - Retrieve Session Data
```python
session_data = redis_manager.get_session(session_id)
```

**What it does:**
- Retrieves JSON string from Redis
- Deserializes back to Python dict
- Converts date strings back to datetime objects
- Returns None if session doesn't exist

### `update_session_analyses()` - Add New Analysis
```python
success = redis_manager.update_session_analyses(session_id, new_analysis)
```

**What it does:**
- Gets existing session data
- Creates session if it doesn't exist
- Appends new analysis to the analyses list
- Saves updated session back to Redis

### `clear_session_analyses()` - Remove All Analyses
```python
success = redis_manager.clear_session_analyses(session_id)
```

**What it does:**
- Empties the analyses list for a session
- Keeps session metadata (created_at, etc.)
- Useful for "clear history" functionality

### Connection Methods

#### `connect()` - Establish Redis Connection
```python
redis_manager.connect()
```
Creates Redis client and tests connection with ping.

#### `is_connected()` - Check Connection Status
```python
if redis_manager.is_connected():
    # Redis is available
else:
    # Use fallback storage
```

## Usage Examples

### Basic Session Operations
```python
from services.redis_manager import redis_manager

# Create session data
session_data = {
    'created_at': datetime.datetime.now(),
    'analyses': []
}

# Store session
session_id = "abc123"
redis_manager.store_session(session_id, session_data)

# Retrieve session
retrieved_data = redis_manager.get_session(session_id)
print(f"Session created: {retrieved_data['created_at']}")
```

### Adding Analysis to Session
```python
# New analysis result
analysis = {
    'id': 'analysis-456',
    'text_preview': 'This is a sample text...',
    'timestamp': datetime.datetime.now(),
    'text_length': 100,
    'result': {
        'ai_probability': 0.75,
        'human_probability': 0.25,
        'confidence': 0.75
    },
    'analysis_type': 'single_text'
}

# Add to session
redis_manager.update_session_analyses(session_id, analysis)
```

### Checking Redis Availability
```python
if redis_manager.is_connected():
    print("Using Redis for session storage")
    redis_manager.store_session(session_id, data)
else:
    print("Redis unavailable, using fallback storage")
    # Use in-memory storage instead
```

## Integration with Flask API

### In app.py
```python
from services.redis_manager import redis_manager

# Global instance used throughout the application
session_data = {}  # Fallback storage

@ensure_session
def some_endpoint():
    session_id = session['session_id']
    
    # Try Redis first
    session_data_redis = redis_manager.get_session(session_id)
    if not session_data_redis:
        # Create new session
        session_data_redis = {
            'created_at': datetime.datetime.now(),
            'analyses': []
        }
        redis_manager.store_session(session_id, session_data_redis)
```

### Session Creation Pattern
```python
@ensure_session
def protected_endpoint():
    # Session ID automatically created/maintained
    sid = session['session_id']
    
    # Get or create session data
    session_data_redis = redis_manager.get_session(sid)
    if not session_data_redis:
        session_data_redis = {
            'created_at': datetime.datetime.now(),
            'analyses': []
        }
        redis_manager.store_session(sid, session_data_redis)
```

## Error Handling and Fallbacks

### Connection Failures
```python
try:
    self.redis_client = redis.Redis(...)
    self.redis_client.ping()
    print("Connected to Redis successfully")
except redis.ConnectionError as e:
    print(f"Failed to connect to Redis: {e}")
    # Application continues with in-memory storage
```

### Operation Failures
```python
def store_session(self, session_id, session_data):
    try:
        # Attempt Redis operation
        self.redis_client.set(key, json.dumps(session_data))
        return True
    except Exception as e:
        print(f"Error saving session: {e}")
        return False
```

### Graceful Degradation
When Redis fails, the application:
1. Logs the error
2. Sets `connected = False`
3. Falls back to in-memory storage
4. Continues normal operation
5. User experience remains intact (but data isn't persistent)

## Data Persistence Strategy

### No Expiration Policy
- Sessions never expire automatically
- Good for academic/demo purposes
- Production would typically add expiration
- Manual cleanup via `clear_session_analyses()`

### Why No Expiration?
```python
# Current: No expiration
self.redis_client.set(key, value)

# Production might use:
# self.redis_client.setex(key, 3600, value)  # Expire in 1 hour
```

For this academic project:
- Users can revisit their analysis history
- No need to worry about session timeouts
- Simpler implementation and testing

## Configuration Options

### Connection Settings
```python
redis_manager = RedisManager(
    host='localhost',    # Redis server address
    port=6379,          # Redis server port
    db=0,               # Redis database number (0-15)
    password=None       # Redis password (if required)
)
```

### Production Configuration
```python
# Environment-based configuration
redis_manager = RedisManager(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    password=os.getenv('REDIS_PASSWORD', None)
)
```

## Performance Considerations

### Memory Usage
- Each session stored as JSON string
- Minimal memory overhead in Redis
- Analysis history grows over time
- Consider cleanup for long-running sessions

### Network Operations
- Each Redis operation involves network call
- Batch operations where possible
- Connection pooling for high-load scenarios
- Local caching for frequently accessed data

### Scalability
- Redis handles thousands of concurrent sessions
- Single Redis instance sufficient for academic use
- Production might need Redis cluster
- Consider data partitioning for very large datasets

## Development and Testing

### Standalone Testing
```python
if __name__ == "__main__":
    manager = RedisManager()
    
    if manager.is_connected():
        # Test basic operations
        test_session = {...}
        manager.store_session('test-session', test_session)
        retrieved = manager.get_session('test-session')
        print("Session storage test: PASSED" if retrieved else "FAILED")
        
        # Cleanup
        manager.delete_session('test-session')
```

### Redis CLI Commands for Debugging
```bash
# Connect to Redis
redis-cli

# List all session keys
KEYS session:*

# Get specific session
GET session:abc123

# Delete session
DEL session:abc123

# Check Redis status
PING
```

### Common Development Tasks

#### View All Sessions
```python
all_sessions = redis_manager.get_all_sessions()
for session in all_sessions:
    print(f"Session {session['session_id']}: {len(session['data']['analyses'])} analyses")
```

#### Cleanup Old Sessions
```python
# Manual cleanup (for development)
def cleanup_old_sessions():
    keys = redis_manager.redis_client.keys("session:*")
    for key in keys:
        redis_manager.redis_client.delete(key)
```

## Security Considerations

### Data Privacy
- Session IDs are UUIDs (hard to guess)
- No personal information stored
- Only text analysis results and metadata
- Sessions isolated by unique IDs

### Access Control
- No authentication within Redis itself
- Security handled at application layer
- API keys required to access endpoints
- Sessions tied to Flask session cookies

### Data Sanitization
- All data serialized through JSON (prevents injection)
- No direct user input stored in Redis keys
- Datetime conversion prevents format issues

## Troubleshooting

### Redis Won't Start
```bash
# Check if Redis is running
redis-cli ping

# Start Redis (Ubuntu/Debian)
sudo systemctl start redis-server

# Start Redis (macOS)
brew services start redis

# Start Redis manually
redis-server
```

### Connection Issues
- Check Redis server is running: `redis-cli ping`
- Verify host and port settings
- Check firewall rules for Redis port (6379)
- Ensure Redis accepts connections from your IP

### Data Issues
- Check JSON serialization: `json.dumps(your_data)`
- Verify datetime handling: all dates should be isoformat strings in Redis
- Test with Redis CLI: `GET session:your-session-id`

### Performance Problems
- Monitor Redis memory usage: `redis-cli info memory`
- Check for large sessions: `redis-cli --bigkeys`
- Consider session cleanup for long-running applications

## Production Deployment

### Configuration Checklist
- [ ] Set Redis password
- [ ] Configure Redis persistence (RDB/AOF)
- [ ] Set up Redis monitoring
- [ ] Configure connection pooling
- [ ] Add session expiration policy
- [ ] Set up Redis backup strategy
- [ ] Monitor memory usage
- [ ] Configure Redis clustering (if needed)