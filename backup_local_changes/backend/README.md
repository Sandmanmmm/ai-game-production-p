# GameForge Backend API

Backend API for the GameForge AI Game Studio platform.

## Features

- **RESTful API** with Express.js and TypeScript
- **PostgreSQL Database** with Prisma ORM
- **Project Management** (CRUD operations)
- **Input Validation** with express-validator
- **Error Handling** middleware
- **Security** features (CORS, Helmet, Rate limiting)
- **Logging** with Morgan
- **Database Migrations** and seeding

## Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- express-validator
- CORS
- Helmet
- Morgan

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v13+)
- npm or yarn

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your database credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/gameforge_db?schema=public"
PORT=3001
FRONTEND_URL=http://localhost:5173
```

5. Generate Prisma client:
```bash
npm run db:generate
```

6. Run database migrations:
```bash
npm run db:migrate
```

7. Seed the database (optional):
```bash
npm run db:seed
```

## Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Health Check
- `GET /` - Welcome message
- `GET /api/health` - API health status

### Projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/all` - Get all projects (with optional filtering)
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project by ID
- `DELETE /api/projects/:id` - Delete project by ID

### Request Examples

#### Create Project
```bash
POST /api/projects
Content-Type: application/json

{
  "userId": "user-1",
  "title": "My Awesome Game",
  "description": "An epic adventure game",
  "status": "DRAFT"
}
```

#### Get All Projects
```bash
GET /api/projects/all
# Optional query parameters:
# ?userId=user-1
# ?status=IN_PROGRESS
```

#### Update Project
```bash
PUT /api/projects/:id
Content-Type: application/json

{
  "title": "Updated Game Title",
  "status": "IN_PROGRESS"
}
```

## Project Status Values

- `DRAFT` - Project is being planned
- `IN_PROGRESS` - Project is actively being developed
- `COMPLETED` - Project is finished
- `ARCHIVED` - Project is archived

## Database Schema

### Project Model
```prisma
model Project {
  id          String        @id @default(cuid())
  userId      String
  title       String
  description String?
  status      ProjectStatus @default(DRAFT)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio

## Error Handling

The API includes comprehensive error handling:
- Input validation errors (400)
- Not found errors (404)
- Server errors (500)
- Rate limiting (429)

## Security Features

- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers
- **Rate Limiting** - Prevent API abuse
- **Input Validation** - Prevent malicious input

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
