@echo off
cd /d "%~dp0"
if not exist backend\.venv ( echo Run setup.bat first. & pause & exit /b 1 )
call backend\.venv\Scripts\activate.bat
echo.
echo ==== Training the letters and digits detector ====
echo This makes 6000 practice images from the fonts on your PC, then trains YOLO on your RTX 4050.
echo Expect roughly 30 to 60 minutes. Keep the laptop plugged in. You can stop with Ctrl+C.
echo.
cd backend
python tools\train_letters.py --n 6000 --epochs 40
echo.
echo When it says Done, close this window, start run.bat, open the Vision Lab and choose "Letters and digits" or "Everything".
pause
