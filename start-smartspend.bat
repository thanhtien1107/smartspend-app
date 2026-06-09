@echo off
setlocal EnableExtensions

cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js is not installed or is not available in PATH.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo ERROR: npm is not installed or is not available in PATH.
  pause
  exit /b 1
)

if not exist "node_modules\.bin\vite.cmd" (
  echo Installing project dependencies...
  if exist "package-lock.json" (
    call npm ci
  ) else (
    call npm install
  )

  if errorlevel 1 (
    echo.
    echo ERROR: Could not install project dependencies.
    pause
    exit /b 1
  )
)

echo Starting SmartSpend backend...
start "SmartSpend Backend" cmd /k "call npm start"

echo Starting SmartSpend frontend...
start "SmartSpend Frontend" cmd /k "call npm run dev -- --host localhost --port 5173 --strictPort --open"

echo Waiting for SmartSpend frontend...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline = (Get-Date).AddSeconds(60); do { try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5173' -TimeoutSec 2; if ($response.StatusCode -lt 500) { exit 0 } } catch {}; Start-Sleep -Seconds 1 } while ((Get-Date) -lt $deadline); exit 1"

if errorlevel 1 (
  echo.
  echo ERROR: Frontend did not start at http://localhost:5173 within 60 seconds.
  echo Check the SmartSpend Frontend window for the detailed error.
  pause
  exit /b 1
)

echo SmartSpend frontend is ready.

echo.
echo SmartSpend is starting.
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:5173
echo.
echo Keep the Backend and Frontend windows open while using the app.

endlocal
