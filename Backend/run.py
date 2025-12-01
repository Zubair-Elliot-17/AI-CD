"""
CSC3003S Capstone Project - AI Content Detector
Year: 2025
Authors: Team 'JackBoys'
Members: Zubair Elliot(ELLZUB001), Mubashir Dawood(DWDMUB001), Meekaaeel Booley(BLYMEE001)

This is the main entry point for our Flask application
It starts the web server and checks dependencies before running
"""

# Import the Flask app from our api package
from api.app import app

# This condition ensures the code only runs when we execute this file directly
# (not when it's imported as a module in another file)
if __name__ == '__main__':
    # Check if Redis is working before starting the server
    # Redis is used for storing session data and analysis history
    from services.redis_manager import redis_manager
    
    # Test the Redis connection... if it fails, we'll still run but with a warning
    if not redis_manager.is_connected():
        print("WARNING: Redis connection failed. Sessions will not be persisted.")
        # Without Redis, user sessions and analysis history won't be saved between server restarts
        # But the AI detection will still work for individual requests
    
    # Start the Flask development server
    app.run(debug=True, host='0.0.0.0', port=5000)  # Set debug=False for production
    
    # Parameters explained:
    # debug=True... Enables hot-reload and detailed error pages (great for development)
    # host='0.0.0.0'. Makes the server accessible from other devices on the network
    # port=5000. The port number where our API will be available