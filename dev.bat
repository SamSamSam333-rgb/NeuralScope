@echo off
rem Developer mode: API on :8000 with auto-reload, Vite dev server on :5173 with hot reload.
cd /d "%~dp0"
call backend\.venv\Scripts\activate.bat
start "NeuralScope API" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 8000"
cd frontend
call npm run dev
