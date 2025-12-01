"""
CSC3003S Capstone Project - AI Content Detector
Year: 2025
Authors: Team 'JackBoys'
Members: Zubair Elliot(ELLZUB001), Mubashir Dawood(DWDMUB001), Meekaaeel Booley(BLYMEE001)

This file is the main analysis engine. It coordinates text processing and AI detection
It decides whether to analyze text as a whole or split into sentences for better accuracy

Two Analysis Strategies:
    Single Text Analysis: For short texts (1 sentence), analyzes the whole thing at once
    Sentence-Level Analysis: For long texts, splits into sentences and analyzes each one separately, then combines results

Why Sentence-Level Analysis is Better:
    More accurate for long documents (AI and human writing can be mixed)
    Provides detailed breakdown showing which parts are AI vs human
    Handles cases where only some sentences are AI-generated

The Analysis Pipeline:
    Input Validation: Checks text length and security
    Sentence Splitting: Uses smart regex to avoid splitting on abbreviations like "Dr."
    AI Detection: Sends each sentence to the model for classification
    Result Aggregation: Combines individual sentence results into overall scores
    Statistics Calculation: Provides confidence ranges, percentages, etc.

Key Features:
    Error Resilience: If one sentence fails, others still get processed
    Smart Splitting: Handles tricky cases like "U.S.A." or "Mr. Smith
    Detailed Metrics: Provides min/max confidence, standard deviation, etc.
    Flexible Output: Returns data in both API-friendly and session-storage formats

Important Technical Details:
    re.split() with complex regex: Handles sentence boundaries intelligently
    statistics.mean(): Averages probabilities across sentences
    Error handling per sentence: Prevents one bad sentence from breaking entire analysis
    Rounding: Keeps probabilities readable (4 decimal places)

When Each Analysis Type is Used:
    Single text: Texts with 1 sentence or when force_single_analysis=True
    Sentence-level: Texts with 2+ sentences (default for longer documents)

Performance Consideration:
    Sentence-level analysis is slower (makes multiple model calls) but more accurate for long texts. The trade-off is worth it for better results!
"""

import re
import statistics
from services.model import AIDetectionModel  # Our AI detection model

class SecurityError(Exception):
    # Custom exception for security-related issues
    # (Currently not used much, but here for future expansion)
    pass

class TextAnalyser:
    # Handles text analysis including sentence splitting and AI detection
    
    # Minimum sentence length to analyze (very short sentences aren't reliable)
    MIN_SENTENCE_LENGTH = 10
    
    # Maximum total text length to prevent extremely long processing
    MAX_TEXT_LENGTH = 100000
    
    def __init__(self):
        # Initialize the AI detection model that does the actual classification
        self.model = AIDetectionModel()
        
    def validate_input_length(self, text, max_length=None):
        # Basic validation to ensure text is within reasonable limits
        if max_length is None:
            max_length = self.MAX_TEXT_LENGTH
        word_count = len(text.split())
        if word_count < 10:
            raise ValueError('Text must be at least 10 words long')
        if len(text) > max_length:
            raise ValueError(f'Text exceeds maximum length of {max_length} characters')
    
    
    def perform_security_checks(self, text):
        # Placeholder for security checks. Currently just does length validation
        # Could be expanded to check for malicious content or other issues
        self.validate_input_length(text)
        return text  # Return the text if it passes checks

    def split_into_sentences(self, text):
        # Split text into sentences. Returns a list of sentences with their positions in the original text.
        # This uses regex to find sentence boundaries while avoiding false positives like "Dr. Smith"
        
        # Enhanced sentence splitting pattern. This regex is smart about abbreviations
        # It looks for sentence endings (. ! ?) but avoids splitting on things like "Mr." or "U.S.A."
        sentence_pattern = r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\!|\?)\s+'
        
        # Split the text using our pattern
        sentences = re.split(sentence_pattern, text.strip())
        
        # Filter out empty sentences and very short ones (they're not reliable for AI detection)
        valid_sentences = []
        for sentence in sentences:
            sentence = sentence.strip()  # Remove extra whitespace
            if len(sentence) >= self.MIN_SENTENCE_LENGTH:  # Only keep reasonably long sentences
                valid_sentences.append(sentence)
        
        return valid_sentences
    
    def calculate_overall_confidence(self, sentence_results):
        # Calculate overall confidence metrics from individual sentence results.
        # This aggregates all the sentence-level predictions into one overall score
        
        if not sentence_results:  # Handle empty input
            return {
                'overall_ai_probability': 0.0,
                'overall_human_probability': 1.0,
                'overall_confidence': 0.0,
                'sentence_count': 0,
                'ai_sentence_count': 0,
                'human_sentence_count': 0
            }
        
        # Lists to collect probabilities from successful analyses
        ai_probabilities = []
        human_probabilities = []
        confidences = []
        ai_count = 0
        human_count = 0
        
        # Process each sentence result
        for result in sentence_results:
            if 'error' not in result:  # Only use successful analyses
                ai_prob = result['result']['ai_probability']
                human_prob = result['result']['human_probability']
                confidence = result['result']['confidence']
                
                # Collect the data for averaging
                ai_probabilities.append(ai_prob)
                human_probabilities.append(human_prob)
                confidences.append(confidence)
                
                # Count sentences by predicted class
                if ai_prob > 0.5:  # If AI probability is higher than 50%
                    ai_count += 1
                else:
                    human_count += 1
        
        # Handle case where all sentences had errors
        if not ai_probabilities:
            return {
                'overall_ai_probability': 0.0,
                'overall_human_probability': 1.0,
                'overall_confidence': 0.0,
                'sentence_count': len(sentence_results),
                'ai_sentence_count': 0,
                'human_sentence_count': 0,
                'errors': len(sentence_results)  # Track how many failed
            }
        
        # Calculate weighted averages across all sentences
        overall_ai_prob = statistics.mean(ai_probabilities)
        overall_human_prob = statistics.mean(human_probabilities)
        overall_confidence = statistics.mean(confidences)
        
        # Return comprehensive summary statistics
        return {
            'overall_ai_probability': round(overall_ai_prob, 4),
            'overall_human_probability': round(overall_human_prob, 4),
            'overall_confidence': round(overall_confidence, 4),
            'overall_classification': 'AI-generated' if overall_ai_prob > 0.5 else 'Human-written',
            'sentence_count': len(sentence_results),  # Total sentences attempted
            'analyzed_sentences': len(ai_probabilities),  # Actually successful analyses
            'ai_sentence_count': ai_count,
            'human_sentence_count': human_count,
            'ai_percentage': round((ai_count / len(ai_probabilities)) * 100, 1) if ai_probabilities else 0,
            'confidence_range': {  # Statistics about confidence distribution
                'min': round(min(confidences), 4),
                'max': round(max(confidences), 4),
                'std_dev': round(statistics.stdev(confidences), 4) if len(confidences) > 1 else 0
            }
        }
    
    def analyse_sentences(self, sentences):
        # Analyse multiple sentences using AI detection. Returns results for each sentence.
        # This is where we actually call the AI model for each sentence
        
        results = []
        
        for idx, sentence in enumerate(sentences):
            try:
                # Removed length checks. Process all sentences regardless of length
                # (The filtering already happened in split_into_sentences)
                
                # AI model prediction for this sentence. This is the expensive part!
                prediction = self.model.predict(sentence)
                
                # Package the result with metadata
                results.append({
                    'index': idx,  # Position in the original text
                    'sentence': sentence,  # Full sentence text
                    'sentence_preview': sentence[:100] + ('...' if len(sentence) > 100 else ''),  # Short preview
                    'sentence_length': len(sentence),
                    'result': {
                        'ai_probability': prediction['ai_probability'],
                        'human_probability': prediction['human_probability'],
                        'confidence': prediction['confidence'],
                        'classification': 'AI-generated' if prediction['ai_probability'] > 0.5 else 'Human-written'
                    }
                })
            
            except Exception as e:
                # If analysis fails for a sentence, record the error but continue with others
                results.append({
                    'index': idx,
                    'sentence_preview': sentence[:100] + ('...' if len(sentence) > 100 else ''),
                    'error': str(e)  # Store error message for debugging
                })
        
        return results
    
    def analyse_text(self, text, source_type='text', filename=None, force_single_analysis=False):
        # Main analysis method that automatically detects whether to use single-text or sentence-level analysis and returns API-ready JSON.
        # This is the method that app.py calls. It's the entry point for text analysis

        try:
            # Perform basic length check only (security validation)
            text = self.perform_security_checks(text)

            # Detect if multiple sentences are present
            sentences = self.split_into_sentences(text)
            
            # Decision point: use sentence-level analysis for multi-sentence text unless forced otherwise
            enable_sentence_analysis = len(sentences) > 1 and not force_single_analysis
            
            if enable_sentence_analysis:
                # Analyse each sentence individually (more accurate for long texts)
                sentence_results = self.analyse_sentences(sentences)

                # Calculate overall metrics from individual sentence results
                overall_metrics = self.calculate_overall_confidence(sentence_results)
                
                # Return structured results for API response
                return {
                    'analysis_type': 'sentence_level',
                    'result': {
                        'overall_ai_probability': overall_metrics['overall_ai_probability'],
                        'overall_human_probability': overall_metrics['overall_human_probability'],
                        'overall_confidence': overall_metrics['overall_confidence'],
                        'overall_classification': overall_metrics['overall_classification'],
                        'sentence_count': overall_metrics['sentence_count'],
                        'analyzed_sentences': overall_metrics['analyzed_sentences'],
                        'ai_sentence_count': overall_metrics['ai_sentence_count'],
                        'human_sentence_count': overall_metrics['human_sentence_count'],
                        'ai_percentage': overall_metrics['ai_percentage'],
                        'confidence_range': overall_metrics['confidence_range'],
                        'text_length': len(text),
                        'source_type': source_type,
                        'filename': filename
                    },
                    'sentence_results': sentence_results,  # Detailed per-sentence results
                    # Data for session storage (slightly different format)
                    'session_data': {
                        'sentence_analysis': sentence_results,
                        'overall_result': overall_metrics,
                        'analysis_type': 'sentence_level'
                    }
                }
            else:
                # Single text analysis (for short texts or when forced)
                prediction = self.model.predict(text)
                
                return {
                    'analysis_type': 'single_text',
                    'result': {
                        'ai_probability': prediction['ai_probability'],
                        'human_probability': prediction['human_probability'],
                        'confidence': prediction['confidence'],
                        'classification': 'AI-generated' if prediction['ai_probability'] > 0.5 else 'Human-written',
                        'text_length': len(text),
                        'source_type': source_type,
                        'filename': filename
                    },
                    # Data for session storage
                    'session_data': {
                        'result': prediction,
                        'analysis_type': 'single_text'
                    }
                }
        except Exception as e:
            # Catch any unexpected errors and re-raise with helpful message
            raise Exception(f'Analysis failed: {str(e)}')