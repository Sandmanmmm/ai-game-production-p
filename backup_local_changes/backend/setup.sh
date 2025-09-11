#!/bin/bash

echo "🎮 GameForge Backend Setup"
echo "=========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found. Make sure PostgreSQL is installed."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f .env ]; then
    echo "📋 Copying .env.example to .env"
    cp .env.example .env
    echo "⚠️  Please update the DATABASE_URL in .env with your PostgreSQL credentials"
else
    echo "✅ .env file already exists"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update DATABASE_URL in .env with your PostgreSQL credentials"
echo "2. Run 'npm run db:migrate' to create database tables"
echo "3. Run 'npm run db:seed' to add sample data (optional)"
echo "4. Run 'npm run dev' to start the development server"
echo ""
echo "Happy coding! 🚀"
