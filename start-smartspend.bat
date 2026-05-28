@echo off
setlocal

cd /d "%~dp0"

echo Starting SmartSpend backend...
start "SmartSpend Backend" cmd /k "npm start"

timeout /t 3 /nobreak >nul

echo Starting SmartSpend frontend...
start "SmartSpend Frontend" cmd /k "npm run dev"

timeout /t 5 /nobreak >nul

echo Opening SmartSpend in browser...
start "" "http://localhost:5173"

echo.
echo SmartSpend is starting.
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:5173
echo.
echo Keep the Backend and Frontend windows open while using the app.

endlocal
