@echo off
REM ============================================================================
REM CONFITERIA QUELITA - SERVICE HEALTH CHECK (Windows)
REM Quick check of all required services before running tests
REM Usage: scripts\check-services.bat
REM ============================================================================

echo.
echo ================================================================
echo   [36m Confiteria Quelita - Service Health Check[0m
echo ================================================================
echo.

set ALL_OK=1

REM Check Node.js
echo Checking Node.js...
where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [32m[OK][0m Node.js !NODE_VERSION!
) else (
    echo [31m[X] Not installed[0m
    set ALL_OK=0
)

REM Check npm
echo Checking npm...
where npm >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [32m[OK][0m npm v!NPM_VERSION!
) else (
    echo [31m[X] Not installed[0m
    set ALL_OK=0
)

REM Check MongoDB
echo Checking MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if %errorlevel% equ 0 (
    echo [32m[OK][0m Running
) else (
    echo [31m[X] Not running[0m
    echo [33m  Start MongoDB from Services or MongoDB Compass[0m
    set ALL_OK=0
)

REM Check Backend
echo Checking Backend (http://localhost:5000)...
curl -s -o nul -w "%%{http_code}" http://localhost:5000/health | findstr "200 404" >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m[OK][0m Running
) else (
    echo [31m[X] Not running[0m
    echo [33m  Start with: cd backend ^&^& npm run dev[0m
    set ALL_OK=0
)

REM Check Frontend
echo Checking Frontend (http://localhost:3000)...
curl -s -o nul -w "%%{http_code}" http://localhost:3000 | findstr "200 404" >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m[OK][0m Running
) else (
    echo [31m[X] Not running[0m
    echo [33m  Start with: cd frontend ^&^& npm run dev[0m
    set ALL_OK=0
)

REM Check Backend dependencies
echo Checking Backend dependencies...
if exist "backend\node_modules" (
    echo [32m[OK][0m Installed
) else (
    echo [31m[X] Not installed[0m
    echo [33m  Install with: cd backend ^&^& npm install[0m
    set ALL_OK=0
)

REM Check Frontend dependencies
echo Checking Frontend dependencies...
if exist "frontend\node_modules" (
    echo [32m[OK][0m Installed
) else (
    echo [31m[X] Not installed[0m
    echo [33m  Install with: cd frontend ^&^& npm install[0m
    set ALL_OK=0
)

REM Check Backend .env
echo Checking Backend .env...
if exist "backend\.env" (
    echo [32m[OK][0m Exists
) else (
    echo [33m[!] Missing[0m
    echo [33m  Copy from: copy backend\.env.example backend\.env[0m
)

REM Check Frontend .env.local
echo Checking Frontend .env.local...
if exist "frontend\.env.local" (
    echo [32m[OK][0m Exists
) else (
    echo [33m[!] Missing (optional)[0m
)

echo.
echo ================================================================
if %ALL_OK% equ 1 (
    echo [32m[OK] All critical services are ready![0m
    echo [32m  You can run tests with: npm test[0m
    exit /b 0
) else (
    echo [31m[X] Some services are not ready[0m
    echo [33m  Fix the issues above before running tests[0m
    exit /b 1
)
