"""
CSC3003S Capstone Project - AI Content Detector
Year: 2025
Authors: Team 'JackBoys'
Members: Zubair Elliot(ELLZUB001), Mubashir Dawood(DWDMUB001), Meekaaeel Booley(BLYMEE001)

This file handles all the file upload processing.
It can read PDF, DOCX, and TXT files and extract the text content.

The File Processing Pipeline:
    Validation: Checks if file is safe and supported.
    Temporary Storage: Saves upload to a temp file (required by extraction libraries).
    Text Extraction: Uses different libraries based on file type.
    Cleanup: Always deletes temp files to avoid disk clutter.

Supported File Types & How Theyre Handled:
    PDF: Uses PyPDF2 to read each page and extract text.
    DOCX: Uses python-docx to read paragraphs from Word documents.
    TXT: Simple file reading with encoding fallback (UTF-8 to Latin-1)

Safety Features:
    File Type Whitelist: Only allows specific extensions, prevents executable uploads.
    Size Limits: Prevents huge files that could crash our server
    Temporary Files: Uploads are never permanently stored on server.

Key Technical Details:
    empfile.mkstemp(): Creates secure temporary files with unique names.
    finally block: Ensures cleanup happens even if extraction fails
    Encoding fallback: Handles text files with different character encodings.
    Chunked reading: Processes large files efficiently without loading everything into memory

Why We Need Temporary Files:
    The text extraction libraries (PyPDF2, python-docx) need actual files on disk to work with. We can't just pass them the uploaded file data directly.
"""

import os
import tempfile
from typing import Tuple, Optional
import PyPDF2  # Library for reading PDF files
import docx    # Library for reading Word documents
from contextlib import contextmanager

class FileProcessor:
    # This class is responsible for handling file uploads and text extraction
    
    # What file types we allow users to upload
    ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx'}
    
    # Maximum file size (500KB) to prevent huge uploads
    MAX_FILE_SIZE = 500 * 1024  # 500kb
    
    def __init__(self, upload_folder=None):
        # Set where to temporarily store uploaded files
        # If no folder specified, use system's temp directory
        self.upload_folder = upload_folder or tempfile.gettempdir()
        
    def allowed_file(self, filename):
        # Check if file extension is allowed
        # Returns True if file type is supported, False if not
        if not filename or '.' not in filename:
            return False
        
        # Get the file extension (the part after the last dot)
        extension = filename.rsplit('.', 1)[1].lower()
        return extension in self.ALLOWED_EXTENSIONS

    def validate_uploaded_file(self, file) -> Tuple[bool, Optional[str]]:
        # Basic file validation... checks if file is safe to process
        # Returns (is_valid, filename_or_error_message)
        
        if not file or not file.filename:
            return False, "No file provided"

        # Check if file type is supported
        if not self.allowed_file(file.filename):
            return False, "File type not supported. Please upload PDF, DOCX, or TXT files."
        
        # Check file size to prevent huge uploads
        file.stream.seek(0, 2)  # Seek to end to get file size
        file_size = file.stream.tell()  # Get current position (which is file size)
        file.stream.seek(0)  # Reset stream position to beginning for later reading
        
        if file_size > self.MAX_FILE_SIZE:
            return False, f"File size exceeds maximum limit of {self.MAX_FILE_SIZE // 1024}KB"
        
        return True, file.filename  # File passed all checks!

    def extract_text_from_pdf(self, file_path):
        # Extract text from PDF file using PyPDF2 library
        try:
            with open(file_path, 'rb') as file:  # 'rb' = read binary mode
                reader = PyPDF2.PdfReader(file)
                text = ''
                # Go through each page and extract text
                for page in reader.pages:
                    text += page.extract_text() + '\n'  # Add newline between pages
                return text.strip()  # Remove extra whitespace
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            return ''  # Return empty string if extraction fails

    def extract_text_from_docx(self, file_path):
        # Extract text from DOCX (Word) file using python-docx library
        try:
            doc = docx.Document(file_path)
            text = ''
            # Read each paragraph in the document
            for paragraph in doc.paragraphs:
                text += paragraph.text + '\n'
            return text.strip()
        except Exception as e:
            print(f"Error extracting text from DOCX: {e}")
            return ''

    def extract_text_from_txt(self, file_path):
        # Extract text from TXT file... simplest case, just read the file
        try:
            # First try UTF-8 encoding (most common)
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read().strip()
        except UnicodeDecodeError:
            # If UTF-8 fails, try Latin-1 encoding (handles different character sets)
            try:
                with open(file_path, 'r', encoding='latin-1') as file:
                    return file.read().strip()
            except Exception as e:
                print(f"Error extracting text from TXT: {e}")
                return ''
        except Exception as e:
            print(f"Error extracting text from TXT: {e}")
            return ''

    def process_file(self, uploaded_file, upload_folder=None):
        # Main method: Process uploaded file and extract text
        # This is the method that other parts of our app will call
        
        if not uploaded_file or not uploaded_file.filename:
            raise ValueError("No file provided")
        
        # Step 1: Validate the uploaded file
        is_valid, result = self.validate_uploaded_file(uploaded_file)
        if not is_valid:
            raise ValueError(result)  # result contains the error message
            
        filename = result  # Now result is the filename since validation passed
        file_extension = filename.rsplit('.', 1)[1].lower()  # Get file extension
        
        # Step 2: Create a temporary file to store the upload
        # mkstemp creates a unique temporary file and returns a file descriptor and path. ChatGPT assisted me with the following line:
        fd, file_path = tempfile.mkstemp(suffix=f'_{filename}', prefix='upload_')
        
        try:
            # Step 3: Save uploaded file to temporary location
            # We need to do this because the extraction libraries need a file on disk
            with os.fdopen(fd, 'wb') as temp_file:  # 'wb' = write binary mode
                uploaded_file.stream.seek(0)  # Reset file pointer to beginning
                chunk_size = 8192  # Read in 8KB chunks to handle large files efficiently
                while True:
                    chunk = uploaded_file.stream.read(chunk_size)
                    if not chunk:  # No more data to read
                        break
                    temp_file.write(chunk)  # Write chunk to temporary file
            
            # Step 4: Extract text based on file extension
            if file_extension == 'pdf':
                text = self.extract_text_from_pdf(file_path)
            elif file_extension == 'docx':
                text = self.extract_text_from_docx(file_path)
            elif file_extension == 'txt':
                text = self.extract_text_from_txt(file_path)
            else:
                # This shouldn't happen since we validated, but safety check
                raise ValueError("Unsupported file type")
            
            # Return the extracted text and original filename
            return text, filename
        
        finally:
            # Step 5: Clean up temporary file no matter what happens
            # This 'finally' block runs even if there's an error above
            try:
                os.close(fd)  # Close the file descriptor
            except OSError:
                pass  # If it's already closed, that's fine
            
            # Delete the temporary file if it exists
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    print(f"Delete error for {file_path}: {e}")
                    # Don't raise exception here... we don't want file deletion errors to interrupt the main functionality