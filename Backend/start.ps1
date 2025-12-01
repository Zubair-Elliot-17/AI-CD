# Run Redis inside WSL and then start the python flask app

# The following line is derived from chatGPT. Neat trick to run commands in wsl from powershell.
# Start Redis in WSL (requires sudo password ). 
wsl -e bash -c "sudo systemctl start redis-server"

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Run python application
python run.py
