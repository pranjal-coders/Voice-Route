@echo off
echo.
echo ================================================
echo        VoiceRoute Project Setup Wizard
echo ================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/
    echo Then run this script again.
    pause
    exit /b 1
)

REM Check if MySQL is installed
mysql --version >nul 2>&1
if errorlevel 1 (
    echo ❌ MySQL is not installed or not in PATH!
    echo Please install MySQL and add it to your PATH.
    pause
    exit /b 1
)

echo ✅ Node.js and MySQL detected
echo.

REM Install npm dependencies
echo 📦 Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo ❌ npm install failed!
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo 🔧 Creating .env file...
    copy .env.example .env >nul 2>&1
    echo.
    echo ⚠️  IMPORTANT: Please edit the .env file with your MySQL password!
    echo    Open .env in notepad and update DB_PASSWORD=your_actual_password
    echo.
    pause
)

echo.
echo 🗄️  Setting up database...
echo Please enter your MySQL root password when prompted.
echo.

REM Setup database schema
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS voiceroute_db;"
if errorlevel 1 (
    echo ❌ Database creation failed!
    pause
    exit /b 1
)

mysql -u root -p voiceroute_db < database/schema.sql
if errorlevel 1 (
    echo ❌ Schema import failed!
    pause
    exit /b 1
)

mysql -u root -p voiceroute_db < database/sample_data.sql  
if errorlevel 1 (
    echo ❌ Sample data import failed!
    pause
    exit /b 1
)

echo.
echo ✅ Database setup completed successfully!
echo.
echo ================================================
echo           Setup Complete! 🎉
echo ================================================
echo.
echo Next steps:
echo 1. Make sure your .env file has the correct MySQL password
echo 2. Start backend: npm start
echo 3. Open index.html in VS Code with Live Server
echo 4. Test at: http://localhost:5000/api/health
echo.
echo Your VoiceRoute application is ready to use!
echo.
pause
