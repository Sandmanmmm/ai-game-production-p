# GameForge Backend - Quick Start Guide

## Option 1: Local Development

### Prerequisites
- Node.js v18+
- PostgreSQL v13+

### Steps
1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Setup database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Seed sample data (optional)
   npm run db:seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Server will be available at: http://localhost:3001

## Option 2: Docker Development

### Prerequisites
- Docker
- Docker Compose

### Steps
1. **Start all services**
   ```bash
   docker-compose up
   ```

   This will start:
   - PostgreSQL database on port 5432
   - Backend API on port 3001

2. **Run migrations (first time only)**
   ```bash
   docker-compose exec api npm run db:migrate
   ```

3. **Seed data (optional)**
   ```bash
   docker-compose exec api npm run db:seed
   ```

## Testing the API

### Using Postman
Import the collection: `GameForge-API.postman_collection.json`

### Using curl
```bash
# Health check
curl http://localhost:3001/api/health

# Create a project
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "title": "My Game",
    "description": "An awesome game",
    "status": "DRAFT"
  }'

# Get all projects
curl http://localhost:3001/api/projects/all
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Welcome message |
| GET | `/api/health` | Health check |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/all` | Get all projects |
| GET | `/api/projects/:id` | Get project by ID |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `NODE_ENV` | Environment | development |

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

### Port Already in Use
- Change PORT in .env file
- Kill process using port 3001: `lsof -ti:3001 | xargs kill`

### Prisma Issues
- Regenerate client: `npm run db:generate`
- Reset database: `npx prisma migrate reset`
