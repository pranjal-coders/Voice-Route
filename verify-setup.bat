@echo off
echo.
echo 🔍 VoiceRoute System Verification Script
echo ========================================
echo.

REM Check Node.js
echo 📦 Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
) else (
    echo ✅ Node.js installed
    node --version
)

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found.
    pause
    exit /b 1
) else (
    echo ✅ npm installed
    npm --version
)

echo.
echo 🗄️ Checking MySQL...
mysql --version >nul 2>&1
if errorlevel 1 (
    echo ❌ MySQL not found. Please install MySQL first.
    pause
    exit /b 1
) else (
    echo ✅ MySQL installed
    mysql --version
)

echo.
echo 📋 Checking project files...

if exist package.json (
    echo ✅ package.json found
) else (
    echo ❌ package.json not found. Are you in the correct directory?
    pause
    exit /b 1
)

if exist database\schema.sql (
    echo ✅ Database schema file found
) else (
    echo ❌ database/schema.sql not found
    pause
    exit /b 1
)

if exist database\sample_data.sql (
    echo ✅ Sample data file found
) else (
    echo ❌ database/sample_data.sql not found
    pause
    exit /b 1
)

if exist index.html (
    echo ✅ Frontend index.html found
) else (
    echo ❌ index.html not found
    pause
    exit /b 1
)

if exist script.js (
    echo ✅ Frontend script.js found
) else (
    echo ❌ script.js not found
    pause
    exit /b 1
)

if exist styles.css (
    echo ✅ Frontend styles.css found
) else (
    echo ❌ styles.css not found
    pause
    exit /b 1
)

if exist server.js (
    echo ✅ Backend server.js found
) else (
    echo ❌ server.js not found
    pause
    exit /b 1
)

if exist .env (
    echo ✅ .env configuration file found
) else (
    echo ⚠️ .env file not found. You'll need to create this.
)

echo.
echo 🎯 Verification Summary:
echo ========================
echo ✅ All prerequisites are installed
echo ✅ All required files are present
echo.
echo Next steps:
echo 1. Set up MySQL database
echo 2. Create .env file with your credentials
echo 3. Run 'npm install'
echo 4. Run 'npm start'
echo.
echo Ready to proceed with setup! 🚀
echo.
pause
