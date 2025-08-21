@echo off
echo JaamSim Server-Side Wrapper
echo ===========================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if we're in the correct directory
if not exist "package.json" (
    echo Error: package.json not found
    echo Please run this script from the server directory
    pause
    exit /b 1
)

REM Check if JaamSim.exe exists
if not exist "..\JaamSim.exe" (
    echo Warning: JaamSim.exe not found in parent directory
    echo Expected location: ..\JaamSim.exe
    echo.
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %ERRORLEVEL% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

echo Starting JaamSim Server...
echo Server will be available at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.

REM Start the server
npm start

pause