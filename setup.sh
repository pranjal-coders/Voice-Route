#!/bin/bash

echo "================================================"
echo "        VoiceRoute Project Setup Wizard"
echo "================================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please download and install Node.js from: https://nodejs.org/"
    exit 1
fi

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed!"
    echo "Please install MySQL first:"
    echo "  macOS: brew install mysql"
    echo "  Ubuntu: sudo apt install mysql-server"
    exit 1
fi

echo "✅ Node.js and MySQL detected"
echo

# Install npm dependencies
echo "📦 Installing Node.js dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ npm install failed!"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cp .env.example .env 2>/dev/null || echo "Please create .env file manually"
    echo
    echo "⚠️  IMPORTANT: Please edit the .env file with your MySQL password!"
    echo "   Update DB_PASSWORD=your_actual_password"
    echo
    read -p "Press Enter to continue after updating .env file..."
fi

echo
echo "🗄️ Setting up database..."
echo "Please enter your MySQL root password when prompted."
echo

# Setup database schema
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS voiceroute_db;"
if [ $? -ne 0 ]; then
    echo "❌ Database creation failed!"
    exit 1
fi

mysql -u root -p voiceroute_db < database/schema.sql
if [ $? -ne 0 ]; then
    echo "❌ Schema import failed!"
    exit 1
fi

mysql -u root -p voiceroute_db < database/sample_data.sql
if [ $? -ne 0 ]; then
    echo "❌ Sample data import failed!"
    exit 1
fi

echo
echo "✅ Database setup completed successfully!"
echo
echo "================================================"
echo "           Setup Complete! 🎉"
echo "================================================"
echo
echo "Next steps:"
echo "1. Make sure your .env file has the correct MySQL password"
echo "2. Start backend: npm start"
echo "3. Open index.html in VS Code with Live Server"
echo "4. Test at: http://localhost:5000/api/health"
echo
echo "Your VoiceRoute application is ready to use!"
echo
