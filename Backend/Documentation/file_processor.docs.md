# file_processor.py Documentation

**File Upload and Text Extraction Handler**

## What This Program Does

`file_processor.py` handles all file upload operations for the AI Content Detector. It safely processes PDF, DOCX, and TXT files, extracts their text content, and prepares the text for AI analysis. Think of it as a "universal translator" that converts different file formats into plain text.

## Key Responsibilities

1. **File Validation**: Ensures uploaded files are safe, supported, and within size limits
2. **Temporary Storage**: Safely stores uploads for processing (required by extraction libraries)
3. **Text Extraction**: Uses specialized libraries to extract text from different file formats
4. **Security Management**: Prevents malicious file uploads and handles cleanup
5. **Error Handling**: Gracefully handles corrupted files and extraction failures

## How It Works

### The File Processing Pipeline

1. **Upload Received**: User uploads a file through the web API
2. **Validation**: Check file type, size, and basic security
3. **Temporary Storage**: Save file to disk (extraction libraries need this)
4. **Text Extraction**: Use appropriate library based on file type
5. **Cleanup**: Delete temporary file (security and disk space)
6. **Return Text**: Provide extracted text to the analysis engine

### Supported File Types

#### PDF Files
- **Library Used**: PyPDF2
- **How It Works**: Reads each page and extracts text content
- **Limitations**: Can't extract text from images or complex layouts
- **Best For**: Text-based PDFs, documents, articles

#### DOCX Files (Word Documents)
- **Library Used**: python-docx
- **How It Works**: Reads paragraphs from the Word document structure
- **Limitations**: Doesn't extract text from images, headers, or footers
- **Best For**: Standard Word documents with text content

#### TXT Files (Plain Text)
- **How It Works**: Direct file reading with encoding detection
- **Encoding Support**: UTF-8 (primary), Latin-1 (fallback)
- **Best For**: Simple text files, code files, plain documents

## Core Components

### File Validation
```python
class FileProcessor:
    ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx'}
    MAX_FILE_SIZE = 500 * 1024  # 500KB limit
    
    def validate_uploaded_file(self, file):
        # Check file exists and has valid extension
        # Verify file size is within limits
        # Return validation result
```

### Temporary File Management
```python
def process_file(self, uploaded_file):
    # Create secure temporary file
    fd, file_path = tempfile.mkstemp(suffix=f'_{filename}')
    
    try:
        # Process the file
        pass
    finally:
        # Always cleanup, even if processing fails
        os.remove(file_path)
```

### Text Extraction Methods

#### PDF Extraction
```python
def extract_text_from_pdf(self, file_path):
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text() + '\n'
        return text.strip()
```

#### DOCX Extraction  
```python
def extract_text_from_docx(self, file_path):
    doc = docx.Document(file_path)
    text = ''
    for paragraph in doc.paragraphs:
        text += paragraph.text + '\n'
    return text.strip()
```

#### TXT Extraction (with encoding fallback)
```python
def extract_text_from_txt(self, file_path):
    try:
        # Try UTF-8 first (most common)
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read().strip()
    except UnicodeDecodeError:
        # Fall back to Latin-1 if UTF-8 fails
        with open(file_path, 'r', encoding='latin-1') as file:
            return file.read().strip()
```

## Security Features

### File Type Whitelist
Only allows specific, safe file extensions:
```python
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx'}
```
This prevents users from uploading:
- Executable files (.exe, .bat, .sh)
- Script files (.js, .php, .py)
- Archive files (.zip, .rar)
- Other potentially dangerous formats

### Size Limitations
```python
MAX_FILE_SIZE = 500 * 1024  # 500KB
```

Prevents:
- Large files that could crash the server
- Denial of service attacks through massive uploads
- Disk space exhaustion

### Temporary File Security
- Uses `tempfile.mkstemp()` for secure temporary file creation
- Files are deleted immediately after processing
- Unique file names prevent conflicts
- Proper file permissions

## Main Methods

### `process_file()` - Main Entry Point
This is the method called by `app.py` to handle file uploads:

```python
text, filename = file_processor.process_file(uploaded_file)
```

**Process Flow:**
1. Validates the uploaded file
2. Creates secure temporary file
3. Saves upload to temporary location
4. Extracts text based on file type
5. Cleans up temporary file
6. Returns extracted text and original filename

### `validate_uploaded_file()` - Security Check
```python
is_valid, result = file_processor.validate_uploaded_file(file)
if not is_valid:
    raise ValueError(result)  # result contains error message
```

**Validation Checks:**
- File exists and has a filename
- File extension is in allowed list
- File size is within limits
- File stream is readable

### Individual Extraction Methods

Each file type has its own specialized extraction method:

#### `extract_text_from_pdf()`
- Opens PDF in binary mode (`'rb'`)
- Uses PyPDF2.PdfReader to parse PDF structure
- Iterates through each page
- Extracts text content from each page
- Combines all pages with newline separators
- Handles corrupted PDFs gracefully

#### `extract_text_from_docx()`
- Uses python-docx library to read Word documents
- Accesses document structure (paragraphs)
- Extracts text from each paragraph
- Combines paragraphs with newlines
- Ignores headers, footers, and images

#### `extract_text_from_txt()`
- Attempts UTF-8 encoding first (most common)
- Falls back to Latin-1 if UTF-8 fails
- Handles different character encodings
- Strips whitespace from content

## Usage Examples

### Basic File Processing
```python
from services.file_processor import FileProcessor

processor = FileProcessor()

# Process an uploaded file
try:
    text, filename = processor.process_file(uploaded_file)
    print(f"Extracted {len(text)} characters from {filename}")
except ValueError as e:
    print(f"File processing failed: {e}")
```

### Manual Validation
```python
is_valid, result = processor.validate_uploaded_file(uploaded_file)
if is_valid:
    print(f"File {result} is valid")
else:
    print(f"Validation failed: {result}")
```

### Direct Text Extraction (for testing)
```python
# Extract from specific file types
pdf_text = processor.extract_text_from_pdf("/path/to/file.pdf")
docx_text = processor.extract_text_from_docx("/path/to/file.docx")
txt_text = processor.extract_text_from_txt("/path/to/file.txt")
```

## Error Handling

### Common Error Scenarios

#### Invalid File Types
```python
# User uploads unsupported file
return False, "File type not supported. Please upload PDF, DOCX, or TXT files."
```

#### File Too Large
```python
if file_size > self.MAX_FILE_SIZE:
    return False, f"File size exceeds maximum limit of {self.MAX_FILE_SIZE // 1024}KB"
```

#### Corrupted Files
```python
try:
    # Attempt extraction
    return extracted_text
except Exception as e:
    print(f"Error extracting text: {e}")
    return ''  # Return empty string instead of crashing
```

#### Encoding Issues (TXT files)
```python
try:
    # Try UTF-8 first
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()
except UnicodeDecodeError:
    # Fallback to Latin-1
    with open(file_path, 'r', encoding='latin-1') as file:
        return file.read()
```

### Cleanup Guarantee
```python
finally:
    # Always runs, even if extraction fails
    try:
        os.close(fd)
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Cleanup error: {e}")
        # Don't raise - cleanup errors shouldn't break functionality
```

## Integration with Flask API

### In app.py
```python
from services.file_processor import FileProcessor

file_processor = FileProcessor()

@app.route('/api/detect', methods=['POST'])
def detect_ai():
    if 'file' in request.files:
        file = request.files['file']
        try:
            text, filename = file_processor.process_file(file)
            # Proceed with AI analysis
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
```

### Error Response Examples
```json
// Invalid file type
{
    "error": "File type not supported. Please upload PDF, DOCX, or TXT files."
}

// File too large
{
    "error": "File size exceeds maximum limit of 500KB"
}

// No file provided
{
    "error": "No file provided"
}
```

## Configuration Options

### Customizing File Limits
```python
# Increase size limit to 1MB
MAX_FILE_SIZE = 1024 * 1024

# Add new file type
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx', 'rtf'}
```

### Custom Upload Folder
```python
# Specify custom temporary directory
processor = FileProcessor(upload_folder="/custom/temp/path")
```

## Performance Considerations

### Memory Usage
- Files are processed in chunks (8KB at a time)
- Temporary files prevent loading entire file into memory
- Text extraction libraries handle memory efficiently

### Processing Speed
- **TXT files**: Fastest (direct reading)
- **DOCX files**: Medium (XML parsing)
- **PDF files**: Slowest (complex structure parsing)

### Disk Usage
- Temporary files are small (under 500KB)
- Files are deleted immediately after processing
- No permanent storage on server

## Limitations and Known Issues

### PDF Limitations
- Cannot extract text from images within PDFs
- Scanned PDFs (image-based) won't work
- Complex layouts may have text extraction issues
- Password-protected PDFs are not supported

### DOCX Limitations
- Only extracts paragraph text
- Headers, footers, and text boxes are ignored
- Images and embedded objects are skipped
- Table content may not be properly formatted

### TXT File Considerations
- Very large text files may cause memory issues
- Binary content in TXT files may cause encoding errors
- Some special characters may not display correctly

## Security Best Practices

### What's Protected Against
- Executable file uploads (.exe, .bat, .sh)
- Archive bombs (zip files with huge content)
- Path traversal attacks (../../../etc/passwd)
- Large file denial of service
- Persistent file storage on server

### What Could Be Enhanced
```python
# Additional security measures for production:
def enhanced_security_check(self, file_path):
    # Virus scanning
    # Content-type verification
    # Magic number checking
    # Sandboxed processing
```

## Development Notes

### Adding New File Types

To support a new file format:

1. **Add Extension**:
```python
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx', 'rtf'}
```

2. **Create Extraction Method**:
```python
def extract_text_from_rtf(self, file_path):
    # Implementation for RTF files
    pass
```

3. **Update Main Processing Logic**:
```python
elif file_extension == 'rtf':
    text = self.extract_text_from_rtf(file_path)
```

4. **Install Required Library**:
```bash
pip install rtf-library-name
```

### Testing File Processing
```python
# Test with sample files
if __name__ == "__main__":
    processor = FileProcessor()
    
    # Test each file type
    test_files = ['sample.pdf', 'sample.docx', 'sample.txt']
    
    for file_path in test_files:
        if os.path.exists(file_path):
            # Test extraction logic
            pass
```

### Debugging Tips
- Check temporary file creation: `ls /tmp/upload_*`
- Monitor disk usage during processing
- Test with various file types and sizes
- Verify cleanup happens even with errors

## Troubleshooting

### Common Issues

**"No file provided" error**
- Ensure form field name is 'file'
- Check file is actually selected before upload
- Verify Content-Type is multipart/form-data

**"File type not supported"**
- Check file extension is in ALLOWED_EXTENSIONS
- Ensure filename has proper extension
- Verify extension is lowercase

**"File too large" error**
- Reduce file size or increase MAX_FILE_SIZE
- Check if file is corrupted (may report wrong size)

**Empty text extraction**
- PDF: File may be image-based or password protected
- DOCX: File may be corrupted or have no paragraph text
- TXT: File may be binary or use unsupported encoding

**Temporary file errors**
- Check disk space on temporary directory
- Verify write permissions on temp folder
- Ensure cleanup code is running properly