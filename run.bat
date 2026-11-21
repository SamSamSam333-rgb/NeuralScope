@echo off
cd /d "%~dp0"
if not exist backend\.venv ( echo Run setup.bat first. & pause & exit /b 1 )
if not exist frontend\dist ( echo Run setup.bat first. & pause & exit /b 1 )
call backend\.venv\Scripts\activate.bat
echo Starting NeuralScope at http://localhost:8000  (close this window to stop it)
start "" http://localhost:8000
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
