@echo off
title NovaMetrics Financial Dashboard Launcher
color 0B
cls

echo ========================================================
echo        NOVAMETRICS - SAAS FINANCIAL & CASHFLOW ANALYTICS
echo ========================================================
echo.

:: Ensure Node.js is in PATH
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
    ) else if exist "C:\Program Files (x86)\nodejs" (
        set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
    ) else (
        echo [ERROR] Node.js was not found in your system!
        echo Please download and install Node.js from https://nodejs.org
        echo.
        pause
        exit /b 1
    )
)

:: Navigate to project directory
cd /d "%~dp0"

:: Check if node_modules exists, if not install
if not exist "node_modules\" (
    echo [*] First-time setup detected. Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo [*] Starting NovaMetrics Financial Dashboard on port 3002...
echo [*] Terminal will open automatically in your browser...
echo.
echo ========================================================
echo  INTEGRATION STATUS:
echo   - Standalone / Offline Mode: Active (IndexedDB)
echo   - NovaPOS SQLite API:        Auto-detecting on port 3001
echo ========================================================
echo.

:: Open browser after 2 seconds in background
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3002"

call npm run dev
pause
