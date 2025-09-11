# GameForge Backend Setup Script for Windows

Write-Host "🎮 GameForge Backend Setup" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js v18+ first." -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is available
try {
    $null = Get-Command psql -ErrorAction Stop
    Write-Host "✅ PostgreSQL client found" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PostgreSQL client not found. Make sure PostgreSQL is installed." -ForegroundColor Yellow
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm install

# Copy environment file
if (-not (Test-Path .env)) {
    Write-Host "📋 Copying .env.example to .env" -ForegroundColor Blue
    Copy-Item .env.example .env
    Write-Host "⚠️  Please update the DATABASE_URL in .env with your PostgreSQL credentials" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Blue
npm run db:generate

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update DATABASE_URL in .env with your PostgreSQL credentials" -ForegroundColor White
Write-Host "2. Run 'npm run db:migrate' to create database tables" -ForegroundColor White
Write-Host "3. Run 'npm run db:seed' to add sample data (optional)" -ForegroundColor White
Write-Host "4. Run 'npm run dev' to start the development server" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
