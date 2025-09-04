@echo off
echo 🎮 GameForge PostgreSQL Quick Setup
echo ===================================

echo Checking for PostgreSQL installation...
psql --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ PostgreSQL is already installed!
    echo.
    echo To create the GameForge database:
    echo 1. Open pgAdmin or use psql command line
    echo 2. Create database named 'gameforge_db'
    echo 3. Update .env with your credentials
    echo 4. Run: npm run db:migrate
    goto :end
)

echo ❌ PostgreSQL not found. Let's install it!
echo.
echo Choose installation method:
echo 1. Download installer (Recommended - opens browser)
echo 2. Use winget (if available)
echo 3. Manual setup instructions
echo.

set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo Opening PostgreSQL download page...
    start https://www.postgresql.org/download/windows/
    echo.
    echo 📝 Installation Notes:
    echo - Choose a strong password for 'postgres' user
    echo - Keep default port 5432
    echo - Install all components including pgAdmin
    echo.
    echo After installation:
    echo 1. Create database 'gameforge_db' in pgAdmin
    echo 2. Update .env: DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/gameforge_db?schema=public"
    echo 3. Run: npm run db:generate
    echo 4. Run: npm run db:migrate
    echo 5. Run: npm run db:seed
    goto :end
)

if "%choice%"=="2" (
    echo Attempting winget installation...
    winget install PostgreSQL.PostgreSQL
    if %errorlevel% == 0 (
        echo ✅ PostgreSQL installed via winget!
        echo Please restart your terminal and run this script again.
    ) else (
        echo ❌ winget installation failed. Please use option 1.
    )
    goto :end
)

if "%choice%"=="3" (
    echo 📖 Manual Setup Instructions:
    echo.
    echo 1. Visit: https://www.postgresql.org/download/windows/
    echo 2. Download PostgreSQL 15 or 16 installer
    echo 3. Run as Administrator
    echo 4. Set password for 'postgres' user
    echo 5. Keep port 5432
    echo 6. Install pgAdmin and command line tools
    echo 7. Create database 'gameforge_db'
    echo 8. Update .env file with your credentials
    echo.
    goto :end
)

echo Invalid choice. Please run the script again.

:end
echo.
echo For more detailed instructions, see:
echo - POSTGRESQL_SETUP.md
echo - DOCKER_SETUP.md (if you prefer Docker)
echo.
pause
