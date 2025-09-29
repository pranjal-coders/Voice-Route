#!/bin/bash
# VoiceRoute Project Setup Script

echo "🚀 Setting up VoiceRoute Project..."
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL first."
    exit 1
fi

echo "✅ Node.js and MySQL detected"

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Setup environment file
if [ ! -f .env ]; then
    echo "🔧 Creating environment file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your database credentials"
fi

# Setup database
echo "🗄️ Setting up database..."
echo "Please enter your MySQL root password when prompted:"
mysql -u root -p -e "SOURCE database/schema.sql"
mysql -u root -p -e "SOURCE database/sample_data.sql"

echo ""
echo "✅ VoiceRoute setup complete!"
echo ""
echo "🚀 To start the application:"
echo "   Frontend: Open index.html in browser (or use Live Server)"
echo "   Backend:  npm start"
echo ""
echo "🔗 URLs:"
echo "   Frontend: http://localhost:5500 (or your local server)"
echo "   Backend:  http://localhost:5000"
echo "   Health:   http://localhost:5000/api/health"
echo ""
echo "📖 Check README.md for detailed documentation"
