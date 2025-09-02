# PostgreSQL Installation Guide for Windows

## Option 1: Direct PostgreSQL Installation (Recommended)

### Step 1: Download PostgreSQL
1. Go to https://www.postgresql.org/download/windows/
2. Download the PostgreSQL installer (version 15 or 16)
3. Run the installer as Administrator

### Step 2: Installation Settings
When prompted during installation:
- **Password**: Choose a strong password for the `postgres` user (remember this!)
- **Port**: Keep default `5432`
- **Locale**: Keep default
- **Components**: Install all (PostgreSQL Server, pgAdmin, Command Line Tools)

### Step 3: Verify Installation
After installation, open Command Prompt or PowerShell and run:
```bash
psql --version
```

### Step 4: Create GameForge Database
1. Open pgAdmin (installed with PostgreSQL)
2. Connect to PostgreSQL server (localhost)
3. Right-click "Databases" → Create → Database
4. Name: `gameforge_db`
5. Click Save

### Step 5: Update .env File
Replace the DATABASE_URL in your `.env` file:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/gameforge_db?schema=public"
```
Replace `YOUR_PASSWORD` with the password you set during installation.

## Option 2: Using Chocolatey (Package Manager)

If you have Chocolatey installed:
```bash
choco install postgresql
```

## Option 3: Using winget (Windows Package Manager)

If you have winget (Windows 10/11):
```bash
winget install PostgreSQL.PostgreSQL
```

## After Installation - Run These Commands:

```bash
cd backend
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Verification Steps:
1. Server should start without database connection errors
2. Visit http://localhost:3001/api/projects/all (should return empty array)
3. Use Postman to create a project
4. Check pgAdmin to see the data in the database
