# Development Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run db:generate

# Expose port
EXPOSE 3001

# Start development server
CMD ["npm", "run", "dev"]
