# Create python virtual environment for the packages
python -m venv venv
.\venv\Scripts\Activate.ps1

# The following line is derived from chatGPT
# Check and install Redis if needed. Will return PONG if redis started, else it will install and start redis server in wsl. Neat trick to use commands in wsl from powershell.
wsl -e bash -c "redis-cli ping || (sudo apt install -y redis-server && sudo systemctl start redis-server)"

# Reason for installing from powershell: Significantly faster than installing python packages on wsl. Only redis server needs to be installed from wsl.

# Installs Python packages. Hang in tight, this will take a while. Lightweight packages are installed as we are only using the model here, not training it. Training takes place on google colab with access to stronger gpu's.
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install transformers flask flask-cors PyPDF2 python-docx werkzeug redis

# Please hang on tight, this will take some time to download :)
Write-Host "Done! Redis should be running in WSL." -ForegroundColor Green
Write-Host "Run: .\venv\Scripts\Activate.ps1 then python run.py" -ForegroundColor Green