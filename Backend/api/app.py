"""
CSC3003S Capstone Project - AI Content Detector
Year: 2025
Authors: Team 'JackBoys'
Members: Zubair Elliot(ELLZUB001), Mubashir Dawood(DWDMUB001), Meekaaeel Booley(BLYMEE001)

This Flask backend follows a typical REST API structure with these key components:

    1. Authentication: Uses API keys (basic protection) and session management
    2. File Processing: Handles PDF, DOCX, and TXT file uploads
    3. AI Detection: Uses a pre-trained model ( electra) to analyze text for AI/human classification
    4. Session Storage: Redis for persistence with memory fallback
    5. Error Handling: Comprehensive error handling for different scenarios

The main flow for AI detection:

    -User submits text or file
    -Validate input
    -Split into sentences (if long)
    -Run AI model on each
    -Aggregate results
    -Store in session
    -Return JSON response

Key design choices:

    - Sentence-level analysis for better accuracy on long texts
    - Session-based history to track user analyses
    - CORS enabled for frontend communication
"""

from flask import Flask, request, jsonify, session
from flask_cors import CORS
import uuid
import datetime
from functools import wraps
import os
from services.file_processor import FileProcessor
from services.text_analyser import TextAnalyser
from services.redis_manager import redis_manager

# API keys for basic authentication... in a non-academic project we'd use environment variables
API_KEYS = {"jackboys25"}

# Decorator to require API key for protected routes
def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check for API key in headers or query parameters
        api_key = request.headers.get('X-API-Key') or request.args.get('api_key')
        
        if not api_key or api_key not in API_KEYS:
            return jsonify({
                'error': 'Valid API key required'
            }), 401
        
        return f(*args, **kwargs)
    return decorated_function

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-here')

# Configure upload settings from FileProcessor class
app.config['UPLOAD_FOLDER'] = FileProcessor().upload_folder
app.config['MAX_CONTENT_LENGTH'] = FileProcessor.MAX_FILE_SIZE

# Session security settings
app.config.update(
    SESSION_COOKIE_SECURE=False,       # Should be True in production with HTTPS
    SESSION_COOKIE_HTTPONLY=True,    # Prevent JavaScript access to cookies
    SESSION_COOKIE_SAMESITE='Lax',         # CSRF protection
)

# Enable CORS for frontend communication
CORS(app, 
     supports_credentials=True,
     origins=["http://localhost:5173"],  # Vite dev server default
     allow_headers=["Content-Type", "X-API-Key"],
     methods=["GET", "POST", "DELETE", "OPTIONS"])

# Fallback session storage if Redis fails
session_data = {}

# Initialize our main service classes
file_processor = FileProcessor()
text_analyser = TextAnalyser()

# Decorator to ensure session exists for each request
def ensure_session(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Create session ID if it doesn't exist
        if 'session_id' not in session:
            session['session_id'] = str(uuid.uuid4())
        sid = session['session_id']
        
        # Try to get session from Redis, create if not exists
        session_data_redis = redis_manager.get_session(sid)
        if not session_data_redis:
            session_data_redis = {
                'created_at': datetime.datetime.now(),
                'analyses': []
            }
            redis_manager.store_session(sid, session_data_redis)
        
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/health', methods=['GET'])
def health_check():
    """Basic health check endpoint to verify API is running"""
    redis_status = "connected" if redis_manager.is_connected() else "disconnected"
    
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.datetime.now().isoformat(),
        'supported_formats': list(FileProcessor.ALLOWED_EXTENSIONS),
        'max_file_size_kb': FileProcessor.MAX_FILE_SIZE / 1024,
        'max_text_length': TextAnalyser.MAX_TEXT_LENGTH,
        'redis_status': redis_status
    })

@app.route('/api/detect', methods=['POST'])
@require_api_key
@ensure_session
def detect_ai():
    """Main endpoint for AI detection... accepts both file uploads and raw text"""
    try:
        text = None
        filename = None
        source_type = 'text'
        is_file_upload = False
        
        # Handle file upload
        if 'file' in request.files:
            file = request.files['file']
            try:
                text, filename = file_processor.process_file(file)
                source_type = 'file'
                is_file_upload = True
            except ValueError as e:
                return jsonify({
                    'error': str(e)
                }), 400
            except Exception as e:
                return jsonify({
                    'error': 'File processing failed'
                }), 400
        
        # Handle JSON text input
        elif request.is_json:
            data = request.get_json()
            if not data or 'text' not in data:
                return jsonify({
                    'error': 'Provide text field in JSON'
                }), 400
            text = data['text'].strip()
            source_type = 'text'
        
        # Handle form-encoded text input
        elif 'text' in request.form:
            text = request.form['text'].strip()
            source_type = 'text'
        
        else:
            return jsonify({
                'error': 'Either upload a file or provide text input'
            }), 400
        
        # Validate we actually got some text
        if not text:
            return jsonify({
                'error': 'No text content found'
            }), 400
        
        # Different validation for files vs direct text input
        if is_file_upload:
            if len(text) < 10:
                return jsonify({
                    'error': 'Extracted text must be at least 10 characters long'
                }), 400
        else:
            word_count = len(text.split())
            if word_count < 10:
                return jsonify({
                    'error': 'Text must be at least 10 words long'
                }), 400

            if len(text) > text_analyser.MAX_TEXT_LENGTH:
                return jsonify({
                    'error': f'Text must be less than {text_analyser.MAX_TEXT_LENGTH:,} characters'
                }), 400

        # Check if user wants to force single analysis (ignore sentence splitting)
        force_single_analysis = False
        if request.is_json and request.get_json().get('force_single_analysis', False):
            force_single_analysis = True
        elif 'force_single_analysis' in request.form:
            force_single_analysis = True
        
        # Perform the actual AI detection analysis
        try:
            analysis_result = text_analyser.analyse_text(
                text, 
                source_type=source_type, 
                filename=filename, 
                force_single_analysis=force_single_analysis,
            )
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            return jsonify({
                'error': 'Text analysis failed'
            }), 500

        # Generate unique ID for this analysis
        analysis_id = str(uuid.uuid4())
        
        # Prepare session data for storage
        session_analysis = {
            'id': analysis_id,
            'text_preview': text,
            'timestamp': datetime.datetime.now(),
            'text_length': len(text),
            'source_type': source_type,
            'filename': filename,
            **analysis_result['session_data']  # Merge analysis results
        }

        # Debug output to help with development
        print(f"=== SESSION DEBUG ===")
        print(f"Session ID: {session['session_id']}")
        print(f"Analysis stored with ID: {analysis_id}")
        session_data_redis = redis_manager.get_session(session['session_id'])
        if session_data_redis:
                print(f"Analyses in Redis: {len(session_data_redis.get('analyses', []))}")
        else:
                print("No session data found in Redis")
                print("=====================")

        # Store analysis in session (Redis preferred, fallback to memory)
        try:
            if redis_manager and redis_manager.update_session_analyses(session['session_id'], session_analysis):
                print(f"{analysis_result['analysis_type']} analysis stored in Redis")
            else:
                print("Redis storage failed, falling back to in-memory session storage")
                if session['session_id'] not in session_data:
                    session_data[session['session_id']] = {'analyses': []}
                session_data[session['session_id']]['analyses'].append(session_analysis)
                print(f"{analysis_result['analysis_type']} analysis stored in session (fallback)")
                
        except Exception as e:
            return jsonify({
                'error': 'Failed to store analysis in session'
            }), 500

        # Return success response with analysis results
        return jsonify({
            'success': True,
            'analysis_id': analysis_id,
            'analysis_type': analysis_result['analysis_type'],
            'result': analysis_result['result'],
            **({'sentence_results': analysis_result['sentence_results']} if 'sentence_results' in analysis_result else {}),
            'session_id': session['session_id']
        })
    except ValueError as e:
        return jsonify({
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'error': 'Internal server error'
        }), 500

@app.route('/api/history', methods=['GET'])
@require_api_key
@ensure_session
def get_history():
    """Get analysis history for current session"""
    try:
        session_id = session['session_id']
        session_data_redis = redis_manager.get_session(session_id)
        
        if not session_data_redis:
            return jsonify({
                'success': True,
                'analyses': [],
                'total_analyses': 0,
                'session_id': session_id
            })
        
        analyses = session_data_redis.get('analyses', [])
        # Return only recent analyses to avoid huge responses
        recent_analyses = analyses[-20:] if len(analyses) > 20 else analyses
        
        return jsonify({
            'success': True,
            'analyses': recent_analyses,
            'total_analyses': len(analyses),
            'session_id': session_id
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error'
        }), 500

@app.route('/api/analysis/<analysis_id>', methods=['GET'])
@require_api_key
@ensure_session
def get_analysis(analysis_id):
    """Get specific analysis by ID"""
    try:
        session_id = session['session_id']
        session_data_redis = redis_manager.get_session(session_id)
        
        if not session_data_redis:
            return jsonify({
                'error': 'Session not found'
            }), 404
        
        analyses = session_data_redis.get('analyses', [])
        # Find the specific analysis by ID
        analysis = next((a for a in analyses if a['id'] == analysis_id), None)
        
        if not analysis:
            return jsonify({
                'error': 'Analysis not found'
            }), 404
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error'
        }), 500

@app.route('/api/session', methods=['GET'])
@require_api_key
@ensure_session
def get_session_info():
    """Get basic session information"""
    try:
        session_id = session['session_id']
        session_data_redis = redis_manager.get_session(session_id)
        
        if not session_data_redis:
            return jsonify({
                'error': 'Session not found'
            }), 404
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'created_at': session_data_redis.get('created_at', '').isoformat() if session_data_redis.get('created_at') else None,
            'total_analyses': len(session_data_redis.get('analyses', []))
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error'
        }), 500

@app.route('/api/clear-history', methods=['DELETE'])
@require_api_key
@ensure_session
def clear_history():
    """Clear all analysis history for current session"""
    try:
        session_id = session['session_id']
        if not redis_manager.clear_session_analyses(session_id):
            return jsonify({
                'error': 'Failed to clear history'
            }), 500
        
        return jsonify({
            'success': True,
            'message': 'History cleared successfully'
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error'
        }), 500
        
# Error handlers for common HTTP errors
@app.errorhandler(413)
def too_large(e):
    return jsonify({
        'error': 'File too large'
    }), 413

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'error': 'Method not allowed'
    }), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error'
    }), 500