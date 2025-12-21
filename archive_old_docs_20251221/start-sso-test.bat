@echo off
REM SSO Quick Start Script for Windows

echo.
echo 🚀 Starting SSO Testing...
echo.
echo 📋 Pre-flight checks:
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
  echo ❌ node_modules not found. Running npm install...
  call npm install
) else (
  echo ✅ node_modules found
)

REM Check if .env exists
if not exist ".env" (
  echo ❌ .env file not found!
  echo Please create .env with required variables:
  echo   - NEXT_PUBLIC_GOOGLE_CLIENT_ID
  echo   - GOOGLE_CLIENT_SECRET
  echo   - JWT_SECRET
  echo   - JWT_REFRESH_SECRET
  echo   - DATABASE_URL
  pause
  exit /b 1
) else (
  echo ✅ .env file found
)

REM Check if jose is installed
call npm list jose >nul 2>&1
if errorlevel 1 (
  echo ❌ jose package not found. Installing...
  call npm install jose
) else (
  echo ✅ jose package installed
)

echo.
echo ✅ All checks passed!
echo.
echo 🚀 Starting development server...
echo.
echo 📖 Testing Instructions:
echo 1. Open browser: http://localhost:3000
echo 2. Click 'Login' button
echo 3. Login with Google
echo 4. Check terminal for middleware logs
echo 5. Try accessing /profil
echo.
echo 📚 Full testing guide: See SSO_TESTING_GUIDE.md
echo.

REM Start dev server
call npm run dev
