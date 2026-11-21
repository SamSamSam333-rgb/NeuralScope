@echo off
setlocal
cd /d "%~dp0"
echo ==== NeuralScope setup ====
where py >nul 2>nul || (echo Python was not found. Install Python 3.12 from python.org and tick "Add python.exe to PATH", then run this again. & pause & exit /b 1)
where node >nul 2>nul || (echo Node.js was not found. Install the LTS version from nodejs.org, then run this again. & pause & exit /b 1)

echo.
echo [1/4] Creating the Python environment...
if not exist backend\.venv ( py -3.12 -m venv backend\.venv || py -3 -m venv backend\.venv )
if errorlevel 1 ( echo Could not create the Python environment. & pause & exit /b 1 )
call backend\.venv\Scripts\activate.bat
python -m pip install --upgrade pip

echo.
echo [2/4] Installing PyTorch (trying the NVIDIA GPU build first, your RTX 4050 will use it)...
pip install torch --index-url https://download.pytorch.org/whl/cu124
if errorlevel 1 (
  echo GPU build failed. Installing the CPU build instead. Everything still works, only slower.
  pip install torch || ( echo PyTorch install failed. & pause & exit /b 1 )
)

echo.
echo [3/4] Installing the other Python packages...
pip install -r backend\requirements.txt || ( echo Package install failed. & pause & exit /b 1 )

echo.
echo [4/4] Installing and building the website...
pushd frontend
call npm install || ( echo npm install failed. & popd & pause & exit /b 1 )
call npm run build || ( echo Build failed. & popd & pause & exit /b 1 )
popd

echo.
echo Done. Double-click run.bat to start NeuralScope.
pause
