"""
CSC3003S Capstone Project - AI Content Detector
Year: 2025
Authors: Team 'JackBoys'
Members: Zubair Elliot(ELLZUB001), Mubashir Dawood(DWDMUB001), Meekaaeel Booley(BLYMEE001)

This program uses our AI detection model. The brain of our application.
It uses a pre-trained transformer model (now Electra) to detect if text was written by AI or humans

Key Components:

    -Tokenizer: Converts words into numbers (like a translator for computers)
    -Neural Network: The actual AI brain that makes predictions
    -Probability Calculator: Turns raw numbers into understandable percentages

How the Model Works:

    -Input: We give it text like "Hello world"
    -Tokenization: The tokenizer breaks this into numbers: [101, 7592, 2088, 102]
    -Processing: The neural network analyzes these numbers
    -Output: We get probabilities like: 80% AI, 20% Human for example

To run this model directly, without using a web server, use:

    python services/model.py

"""

import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification

class AIDetectionModel:
    def __init__(self):
        # Initialize the AI detection model with the appropriate path
        
        # This path is for the backend hosted on the AWS EC2 Instance (Virtual Machine):
        # self.model_path = "/home/ubuntu/aicd-backend/ai_detector_model"
        
        # This path is for when the model is located on our machines.
        # Updated path to reflect new structure
        self.model_path = "./ai_detector_model"  # Model files are in a folder at project root
        
        # Load the tokenizer (converts text to numbers the model understands)
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
        
        # Load the actual neural network model
        self.model = AutoModelForSequenceClassification.from_pretrained(self.model_path)
        
        # Set up device. We're using CPU since most computers don't have good GPUs
        self.device = torch.device("cpu")
        self.model.to(self.device)  # Move model to CPU
        self.model.eval()  # Set model to evaluation mode (not training mode)
    
    def predict(self, text):
        # Predict whether text is AI-generated or human-written
        # Returns a dictionary with probabilities and confidence
        
        # Convert text into numbers (tokens) that the model can process
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)
        
        # Move inputs to the same device as our model (CPU). ChatGPT assisted with this line of code:
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        # Get predictions. torch.no_grad() saves memory since we're not training
        with torch.no_grad():
            outputs = self.model(**inputs)  # Feed text to the model
            logits = outputs.logits  # Raw output from the model
            
            # Convert raw outputs to probabilities between 0 and 1
            probabilities = F.softmax(logits, dim=-1)
            
            # Extract individual probabilities
            human_prob = probabilities[0][0].item()   # Class 0 (human)
            ai_prob = probabilities[0][1].item()      # Class 1 (ai)
            
            # Calculate confidence score (probability of predicted class)
            confidence_score = max(human_prob, ai_prob)
            
        return {
            'human_probability': human_prob,
            'ai_probability': ai_prob,
            'confidence': confidence_score
        }
    
    def predict_with_confidence(self, text):
        # Predict with additional confidence level categorization
        # This is the main method we use. It gives us nice labels like "High confidence"
        
        # First get the basic probabilities
        result = self.predict(text)
        
        # Determine the prediction (1 = AI, 0 = Human)
        prediction = 1 if result['ai_probability'] > result['human_probability'] else 0
        confidence_score = result['confidence']
        
        # Convert numerical confidence to human-readable levels. ChatGPT assisted with defining the following confidence levels.
        if confidence_score >= 0.9:
            confidence_level = "Very High"
        elif confidence_score >= 0.8:
            confidence_level = "High"
        elif confidence_score >= 0.7:
            confidence_level = "Medium"
        elif confidence_score >= 0.6:
            confidence_level = "Low"
        else:
            confidence_level = "Very Low"
        
        # Create label map for readable output
        label_map = {0: "human", 1: "ai"}
        predicted_class = label_map[prediction]
        
        return {
            'prediction': predicted_class,
            'confidence_level': confidence_level,
            'confidence_score': confidence_score,
            'human_probability': result['human_probability'],
            'ai_probability': result['ai_probability']
        }
    
    def batch_predict(self, texts):
        # Predict for multiple texts at once (useful for testing)
        results = []
        for text in texts:
            result = self.predict(text)
            results.append(result)
        return results


# For backwards compatibility and standalone testing
def create_model(model_path):
    # This function exists so old code doesn't break
    # It just creates a new AIDetectionModel instance
    return AIDetectionModel()


# Standalone testing code (only runs when script is executed directly)
if __name__ == "__main__":    
    # This part runs only if we type: python model.py
    # It's great for testing the model without starting the whole web server
    
    # Create model instance. This will load the AI model from disk
    detector = AIDetectionModel()

    # Test sentence to see if our model works
    test_sentence = """Progress in software engineering over the last 50 years has been astonishing. Our societies could not function without large professional software systems."""

    # Get prediction for our test sentence
    result = detector.predict_with_confidence(test_sentence)
    
    # Pretty print the results
    print("="*50)
    print("AI Detection Results")
    print("="*50)
    print(f"Prediction: {result['prediction'].upper()}")
    print(f"Confidence Level: {result['confidence_level']}")
    print(f"Confidence Score: {result['confidence_score']:.4f}")
    print()
    print("Detailed Probabilities:")
    print(f"Human Probability: {result['human_probability']:.4f} ({result['human_probability']*100:.2f}%)")
    print(f"AI Probability: {result['ai_probability']:.4f} ({result['ai_probability']*100:.2f}%)")
    
    # Test multiple sentences at once
    test_sentences = [
        "I feel like a lot of what people think of as a failing of GPT-5 is really a failing of the router.",
        "The router is just not good at knowing when to switch models, or into a mode that uses tools.",
        "The router is supposed to be saving them money by having the people who always use thinking modes sometimes use the basic modes, and to increase the access to thinking modes by those that always use the basic modes.",
        "Cook was clear in positioning privacy as a central pillar of Apple's AI value proposition. The private cloud compute architecture, designed to minimize the amount of user data leaving the device, is a counterpoint to competitors that require extensive cloud data processing."
    ]
    
    print("\n" + "="*50)
    print("Batch Testing Results")
    print("="*50)
    
    # Test all sentences in one go
    batch_results = detector.batch_predict(test_sentences)
    for i, (sentence, result) in enumerate(zip(test_sentences, batch_results)):
        print(f"\n--- Sentence {i+1} ---")
        print(f"Text: {sentence[:100]}{'...' if len(sentence) > 100 else ''}")
        predicted_class = "AI" if result['ai_probability'] > result['human_probability'] else "Human"
        print(f"Prediction: {predicted_class} (Confidence: {result['confidence']:.3f})")
        print(f"Human: {result['human_probability']:.3f}, AI: {result['ai_probability']:.3f}")