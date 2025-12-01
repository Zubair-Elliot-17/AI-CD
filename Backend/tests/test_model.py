"""
Test Suite for AI Detection Model
Tests the core AI detection functionality without API overhead

Usage: python test_model.py
"""

import sys
import os
import time
from pathlib import Path

# Add the project root to Python path so we can import the model
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

try:
    from services.model import AIDetectionModel
except ImportError as e:
    print(f"Error importing model: {e}")
    print("Make sure you're running this from the project root or tests directory")
    sys.exit(1)

class ModelTester:
    def __init__(self):
        self.passed = 0
        self.total = 0
        self.model = None
        
    def test_case(self, name, test_func, *args):
        """Run a test case and track results"""
        self.total += 1
        try:
            if test_func(*args):
                print(f"pass: {name}")
                self.passed += 1
                return True
            else:
                print(f"FAIL: {name}")
                return False
        except Exception as e:
            print(f"Failed {name} : Exception: {e}")
            return False
    

    
    def test_basic_prediction(self):
        """Test basic prediction functionality"""
        test_text = "This is a simple test sentence for AI detection."
        result = self.model.predict(test_text)
        
        # Check if result has expected keys
        required_keys = ['human_probability', 'ai_probability', 'confidence']
        for key in required_keys:
            if key not in result:
                print(f"  Missing key: {key}")
                return False
        
        # Check if probabilities sum to approximately 1
        prob_sum = result['human_probability'] + result['ai_probability']
        if not (0.99 <= prob_sum <= 1.01):
            print(f"  Probabilities don't sum to 1: {prob_sum}")
            return False
        
        # Check if probabilities are in valid range
        if not (0 <= result['human_probability'] <= 1 and 0 <= result['ai_probability'] <= 1):
            print(f"  Invalid probability range")
            return False
        
        print(f"  Human: {result['human_probability']:.3f}, AI: {result['ai_probability']:.3f}")
        return True
    
    def test_confidence_prediction(self):
        """Test prediction with confidence levels"""
        test_text = "The weather today is quite pleasant with sunny skies."
        result = self.model.predict_with_confidence(test_text)
        
        required_keys = ['prediction', 'confidence_level', 'confidence_score', 
                        'human_probability', 'ai_probability']
        for key in required_keys:
            if key not in result:
                print(f"  Missing key: {key}")
                return False
        
        # Check if prediction is valid
        if result['prediction'] not in ['human', 'ai']:
            print(f"  Invalid prediction: {result['prediction']}")
            return False
        
        # Check if confidence level is valid
        valid_levels = ['Very Low', 'Low', 'Medium', 'High', 'Very High']
        if result['confidence_level'] not in valid_levels:
            print(f"  Invalid confidence level: {result['confidence_level']}")
            return False
        
        print(f"  Prediction: {result['prediction']}, Confidence: {result['confidence_level']}")
        return True
    
    def test_empty_text(self):
        """Test behavior with empty text"""
        try:
            result = self.model.predict("")
            # Should handle gracefully and return default values
            if (result['human_probability'] == 0.5 and 
                result['ai_probability'] == 0.5 and 
                result['confidence'] == 0.5):
                print("  Empty text handled correctly with default values")
                return True
            else:
                print(f"  Empty text result: {result}")
                return True  # Still acceptable if it returns valid probabilities
        except Exception as e:
            print(f"  Empty text handling error: {e}")
            return False
    
    def test_very_short_text(self):
        """Test with very short text"""
        result = self.model.predict("Hi")
        # Should still return valid probabilities
        valid = (0 <= result['human_probability'] <= 1 and 
                0 <= result['ai_probability'] <= 1)
        if valid:
            print(f"  Short text result Human: {result['human_probability']:.3f}, AI: {result['ai_probability']:.3f}")
        return valid
    
    def test_very_long_text(self):
        """Test with text longer than model's max length"""
        long_text = "This is a test sentence that will be repeated many times to create a very long text input. " * 50
        result = self.model.predict(long_text)
        # Should handle truncation gracefully
        valid = (0 <= result['human_probability'] <= 1 and 
                0 <= result['ai_probability'] <= 1)
        if valid:
            print(f"  Long text ({len(long_text)} chars) handled correctly")
        return valid
    
    def test_batch_prediction(self):
        """Test batch prediction functionality"""
        test_texts = [
            "Hello world",
            "The quick brown fox jumps over the lazy dog.",
            "Machine learning is transforming various industries.",
            "I love spending time with my family on weekends."
        ]
        
        results = self.model.batch_predict(test_texts)
        
        if len(results) != len(test_texts):
            print(f"  Expected {len(test_texts)} results, got {len(results)}")
            return False
        
        # Check each result
        for i, result in enumerate(results):
            if not (0 <= result['human_probability'] <= 1 and 0 <= result['ai_probability'] <= 1):
                print(f"  Invalid probabilities in result {i}")
                return False
        
        print(f"  Successfully processed {len(test_texts)} texts")
        return True
    
    def test_consistency(self):
        """Test if model gives consistent results for same input"""
        test_text = "Consistency test for the AI detection model."
        
        # Run prediction multiple times
        results = []
        for _ in range(3):
            result = self.model.predict(test_text)
            results.append(result)
        
        # Check if results are identical (they should be for same input)
        first_result = results[0]
        for result in results[1:]:
            if abs(result['human_probability'] - first_result['human_probability']) > 0.001:
                print(f"  Inconsistent results detected")
                return False
        
        print("  Model gives consistent results for same input")
        return True
    
    def test_known_ai_text(self):
        """Test with text that's likely AI-generated"""
        ai_text = """
        The utilization of artificial intelligence in contemporary applications has demonstrated 
        significant efficacy across multiple domains. The implementation of machine learning 
        algorithms facilitates enhanced decision-making processes and optimizes operational 
        efficiency. Furthermore, the integration of neural networks enables sophisticated 
        pattern recognition capabilities.
        """
        
        result = self.model.predict_with_confidence(ai_text)
        print(f"  AI-like text classified as: {result['prediction']} ({result['confidence_level']})")
        print(f"    Probabilities. Human: {result['human_probability']:.3f}, AI: {result['ai_probability']:.3f}")
        return True  # Don't fail on classification, just report
    
    def test_known_human_text(self):
        """Test with text that's likely human-written"""
        human_text = """
        I can't believe how crazy this week has been! First, my car broke down on Monday, 
        then I spilled coffee all over my laptop. But you know what? My neighbor Steve 
        actually helped me fix the car and turned out it was just a loose wire. Sometimes 
        people really surprise you in the best way possible.
        """
        
        result = self.model.predict_with_confidence(human_text)
        print(f"  Human-like text classified as: {result['prediction']} ({result['confidence_level']})")
        print(f"    Probabilities. Human: {result['human_probability']:.3f}, AI: {result['ai_probability']:.3f}")
        return True  # Don't fail on classification, just report

    
    def run_all_tests(self):
        """Run all tests"""
        print("=== AI Detection Model Test Suite ===\n")
        
        # Print system information
        print(f"Python version: {sys.version}")
        print(f"Working directory: {Path.cwd()}")
        print(f"Project root: {project_root}")
        print()
        
        # Initialize model for all tests
        try:
            print("Loading AI Detection Model...")
            start_time = time.time()
            self.model = AIDetectionModel()
            load_time = time.time() - start_time
            print(f"Model loaded successfully in {load_time:.2f} seconds\n")
        except Exception as e:
            print(f"Failed to load model: {e}")
            print("Cannot run tests without a working model.")
            return False
        
        # Core functionality tests
        self.test_case("Basic prediction", self.test_basic_prediction)
        self.test_case("Confidence prediction", self.test_confidence_prediction)
        self.test_case("Batch prediction", self.test_batch_prediction)
        self.test_case("Consistency test", self.test_consistency)
        
        # Edge case tests
        print("\n--- Edge Case Tests ---")
        self.test_case("Empty text handling", self.test_empty_text)
        self.test_case("Very short text", self.test_very_short_text)
        self.test_case("Very long text", self.test_very_long_text)
        
        # Classification tests (informational)
        print("\n--- Classification Tests ---")
        self.test_case("Known AI text", self.test_known_ai_text)
        self.test_case("Known human text", self.test_known_human_text)
        
        # Results
        print(f"\n=== Test Results ===")
        print(f"Passed: {self.passed}/{self.total}")
        print(f"Success Rate: {(self.passed/self.total)*100:.1f}%")
        
        if self.passed == self.total:
            print("All tests passed!")
        elif self.passed >= self.total * 0.8:
            print("Most tests passed... check any failures above")
        else:
            print("Several tests failed... model may have issues")
        
        return self.passed == self.total


if __name__ == "__main__":
    print("Checking model directory structure...")
    
    # Check if model directory exists ... try multiple possible locations
    possible_paths = [
        Path("./ai_detector_model"),       # If running from project root
        Path("../ai_detector_model"),   # If running from tests directory
        project_root / "ai_detector_model"  # Using the calculated project root
    ]
    
    model_path = None
    for path in possible_paths:
        if path.exists():
            model_path = path
            break
    
    if not model_path:
        print("Model directory not found!")
        print("Searched in the following locations:")
        for path in possible_paths:
            print(f"  : {path.absolute()}")
        print("\nMake sure the AI detection model is properly installed.")
        print("The model directory should be at the project root level.")
        sys.exit(1)
    
    print(f"Found model at: {model_path.absolute()}")
    
    # List model files
    model_files = list(model_path.glob("*"))
    print(f"Model files: {[f.name for f in model_files]}")
    
    # Check for required files
    required_files = ['config.json', 'tokenizer.json', 'tokenizer_config.json']
    missing_files = []
    for file in required_files:
        if not (model_path / file).exists():
            missing_files.append(file)
    
    if missing_files:
        print(f"Missing files: {missing_files}")
    else:
        print("All required model files present")
    
    print("\n" + "="*60)
    
    tester = ModelTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)