@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   SSC PrepZone - Restart Script
echo ============================================
echo.

cd /d "%~dp0"
echo   Directory: %cd%
echo.

if not exist "package.json" (
    echo   ERROR: package.json not found in %cd%
    echo   Place restart.bat inside the ssc-prepzone folder.
    echo.
    pause
    exit /b 1
)

echo [1/3] Checking for running dev server...
set "FOUND=0"

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    if "%%a" NEQ "0" (
        echo   Found server on port 5173 ^(PID: %%a^) — killing...
        taskkill /PID %%a /F >nul 2>&1
        set "FOUND=1"
    )
)

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5174 " ^| findstr "LISTENING"') do (
    if "%%a" NEQ "0" (
        echo   Found server on port 5174 ^(PID: %%a^) — killing...
        taskkill /PID %%a /F >nul 2>&1
        set "FOUND=1"
    )
)

if "!FOUND!"=="1" (
    echo   Stopped previous server. Waiting for port release...
    timeout /t 2 /nobreak >nul
) else (
    echo   No existing server running.
)
echo.

if not exist "node_modules\." (
    echo [2/3] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo   ERROR: npm install failed.
        pause
        exit /b 1
    )
) else (
    echo [2/3] Dependencies OK.
)
echo.

echo [3/3] Starting dev server...
echo.
echo   App: http://localhost:5173
echo   Press Ctrl+C to stop
echo.
echo ============================================
echo.
call npm run dev

echo.
echo   Server stopped.
pause
