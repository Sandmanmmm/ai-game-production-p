# Docker Setup for PostgreSQL

## If you prefer Docker, here's how to set it up:

### Step 1: Install Docker Desktop
1. Download from https://www.docker.com/products/docker-desktop/
2. Install Docker Desktop for Windows
3. Start Docker Desktop

### Step 2: Start PostgreSQL with Docker Compose
```bash
cd backend
docker-compose up postgres
```

This will:
- Start PostgreSQL on port 5432
- Create database `gameforge_db`
- Username: `gameforge`
- Password: `gameforge123`

### Step 3: Your .env will use:
```
DATABASE_URL="postgresql://gameforge:gameforge123@localhost:5432/gameforge_db?schema=public"
```

### Step 4: Run migrations in another terminal:
```bash
cd backend
npm run db:generate
npm run db:migrate
npm run db:seed
```
