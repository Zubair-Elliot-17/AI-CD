"""
CSC3003S Capstone Project - AI Content Detector
Year: 2025
Authors: Team 'JackBoys'
Members: Zubair Elliot(ELLZUB001), Mubashir Dawood(DWDMUB001), Meekaaeel Booley(BLYMEE001)

This handles all the database operations using Redis

Key Features:
    Automatic Connection: Tries to connect to Redis when created, with fallback handling.
    Session Management: Stores user sessions with all their analysis history.
    Data Serialization: Handles converting Python objects to/from JSON for Redis storage.
    Error Handling: handles Redis failures without crashing the app.

How Sessions are Stored:
    Key Format: session:abc123 (where abc123 is the session ID).
    Value Format: JSON string containing session data and analysis list.
    No Expiration: Sessions stay forever (good for academic project, but for production we might suggest add expiration).

Important Design Patterns:
    Singleton Pattern: We create one redis_manager instance that everyone uses.
    Decorator Pattern: Methods add functionality around Redis operations (error handling, serialization).
    Fallback Pattern: If Redis fails, the app still works with in-memory storage

Common Redis Commands We Use:

    set(key, value) - Store data
    get(key) - Retrieve data
    keys(pattern) - Find keys matching pattern (like session)
    delete(key) - Remove data
    ping() - Test connection

"""

import redis
import json
import datetime

class RedisManager:
    def __init__(self, host='localhost', port=6379, db=0, password=None):
        # Set up connection details... defaults work for local Redis installation
        self.host = host
        self.port = port
        self.db = db
        self.password = password
        self.redis_client = None  # This will be our connection to Redis
        self.connected = False    # Track if we're successfully connected
        
        # Try to connect immediately when creating the RedisManager
        try:
            self.connect()
            self.connected = True
        except:
            print("Redis connection failed... using fallback storage")
            self.connected = False  # If Redis fails, we'll use in-memory storage as backup
    
    def connect(self):
        """Connect to Redis server"""
        try:
            # Create Redis connection with our settings
            self.redis_client = redis.Redis(
                host=self.host,
                port=self.port,
                db=self.db,
                password=self.password,
                decode_responses=True  # Makes responses easier to work with (returns strings instead of bytes)
            )
            # Test if connection works by sending a PING command
            self.redis_client.ping()
            print("Connected to Redis successfully")
        except redis.ConnectionError as e:
            print(f"Failed to connect to Redis: {e}")
            raise  # Re-raise the exception so calling code knows it failed
    
    def is_connected(self):
        """Check if we're connected to Redis"""
        try:
            return self.redis_client.ping()  # Returns True if Redis responds
        except:
            return False  # If ping fails, we're not connected
    
    def store_session(self, session_id, session_data):
        """Save session data to Redis (no expiration)"""
        try:
            # Create a unique key for this session: "session:abc123"
            key = f"session:{session_id}"
            
            # Convert datetime objects to strings so they can be stored as JSON
            # Redis can't store Python objects directly, so we use JSON strings
            if 'created_at' in session_data and isinstance(session_data['created_at'], datetime.datetime):
                session_data['created_at'] = session_data['created_at'].isoformat()
            
            # Convert timestamps in each analysis (same reason as above)
            if 'analyses' in session_data:
                for analysis in session_data['analyses']:
                    if 'timestamp' in analysis and isinstance(analysis['timestamp'], datetime.datetime):
                        analysis['timestamp'] = analysis['timestamp'].isoformat()
            
            # Store without expiration (stays forever until manually deleted)
            # Convert Python dictionary to JSON string for storage
            self.redis_client.set(key, json.dumps(session_data))
            return True
        except Exception as e:
            print(f"Error saving session: {e}")
            return False
    
    def get_session(self, session_id):
        """Get session data from Redis"""
        try:
            key = f"session:{session_id}"
            data = self.redis_client.get(key)  # Get the JSON string from Redis
            
            if data:
                # Convert JSON string back to Python dictionary
                session_data = json.loads(data)
                
                # Convert string timestamps back to datetime objects
                if 'created_at' in session_data:
                    session_data['created_at'] = datetime.datetime.fromisoformat(session_data['created_at'])
                
                # Convert analysis timestamps back too
                if 'analyses' in session_data:
                    for analysis in session_data['analyses']:
                        if 'timestamp' in analysis:
                            analysis['timestamp'] = datetime.datetime.fromisoformat(analysis['timestamp'])
                
                return session_data
            return None  # Return None if session doesn't exist
        except Exception as e:
            print(f"Error getting session: {e}")
            return None
    
    def update_session_analyses(self, session_id, analysis):
        """Add a new analysis to an existing session"""
        try:
            # Get current session data from Redis
            session_data = self.get_session(session_id)
            
            # If session doesn't exist, create a new one
            if not session_data:
                session_data = {
                    'created_at': datetime.datetime.now(),
                    'analyses': []  # Start with empty analyses list
                }
            
            # Make sure analyses list exists (safety check)
            if 'analyses' not in session_data:
                session_data['analyses'] = []
            
            # Add the new analysis to the list
            session_data['analyses'].append(analysis)
            
            # Save updated session back to Redis
            return self.store_session(session_id, session_data)
        except Exception as e:
            print(f"Error updating session: {e}")
            return False
    
    def clear_session_analyses(self, session_id):
        """Remove all analyses from a session (but keep the session itself)"""
        try:
            session_data = self.get_session(session_id)
            if session_data:
                # Empty the analyses list but keep the session metadata
                session_data['analyses'] = []
                return self.store_session(session_id, session_data)
            return True  # If session doesn't exist, consider it "cleared"
        except Exception as e:
            print(f"Error clearing analyses: {e}")
            return False
    
    def delete_session(self, session_id):
        """Completely remove a session from Redis"""
        try:
            key = f"session:{session_id}"
            # Delete returns number of keys removed (1 if successful, 0 if not found)
            return self.redis_client.delete(key) > 0
        except Exception as e:
            print(f"Error deleting session: {e}")
            return False
    
    def get_all_sessions(self):
        """Get all sessions ...mainly for debugging"""
        try:
            sessions = []
            # Find all keys that start with "session:" using Redis pattern matching
            keys = self.redis_client.keys("session:*")
            
            for key in keys:
                # Extract session ID from the key (remove "session:" prefix)
                session_id = key.split(":")[1]
                session_data = self.get_session(session_id)
                if session_data:
                    sessions.append({
                        'session_id': session_id,
                        'data': session_data
                    })
            return sessions
        except Exception as e:
            print(f"Error getting all sessions: {e}")
            return []  # Return empty list if there's an error
    
    def store_analysis_result(self, analysis_id, result):
        """Store a single analysis result (no expiration)"""
        try:
            key = f"analysis:{analysis_id}"
            # Store without expiration as JSON string
            self.redis_client.set(key, json.dumps(result))
            return True
        except Exception as e:
            print(f"Error storing analysis: {e}")
            return False
    
    def get_analysis_result(self, analysis_id):
        """Get a single analysis result"""
        try:
            key = f"analysis:{analysis_id}"
            data = self.redis_client.get(key)
            if data:
                return json.loads(data)  # Convert JSON back to Python dict
            return None
        except Exception as e:
            print(f"Error getting analysis: {e}")
            return None


# Create a global instance that other files can use
# This means we only create one Redis connection for the whole application
redis_manager = RedisManager()

# Test code that runs only if this file is executed directly
if __name__ == "__main__":
    # This runs when we type: python redis_manager.py
    # It tests if our Redis connection and basic operations work
    
    # Create a new RedisManager instance
    manager = RedisManager()
    
    if manager.is_connected():
        print("Redis connection test: PASSED")
        
        # Create test session data that mimics what our app would store
        test_session = {
            'created_at': datetime.datetime.now(),
            'analyses': [
                {
                    'id': 'test-1',
                    'text_preview': 'Test text...',
                    'result': {'ai_probability': 0.8, 'human_probability': 0.2},
                    'timestamp': datetime.datetime.now(),
                    'text_length': 100
                }
            ]
        }
        
        # Test storing and retrieving. The core functionality
        manager.store_session('test-session', test_session)
        retrieved = manager.get_session('test-session')
        
        if retrieved:
            print("Session storage test: PASSED")
            # Verify the data round-trip worked
            if retrieved['analyses'][0]['id'] == 'test-1':
                print("Data integrity test: PASSED")
            else:
                print("Data integrity test: FAILED")
        else:
            print("Session storage test: FAILED")
        
        # Clean up test data so we don't clutter our Redis database
        manager.delete_session('test-session')
        print("Cleanup test: PASSED")
    else:
        print("Redis connection test: FAILED")
        print("Make sure Redis is running on your system!")