# My First Electric App

A full-stack application with a Node.js backend built with Hono.js, TypeScript, Sequelize ORM, and JWT authentication, and a React frontend built with Vite and TypeScript.

## Architecture

This application follows a 3-layer architecture:

1. **Presentation Layer (Controllers)**: Handles HTTP requests and responses
2. **Business Logic Layer (Services)**: Implements the business logic
3. **Data Access Layer (Repositories)**: Interacts with the database

## Getting Started

```bash
# Install dependencies
pnpm install
cd client && pnpm install && cd ..

# Run the backend server
pnpm run dev

# Run the frontend server
cd client && pnpm run dev
```

## Authentication API

The application provides JWT-based authentication with the following endpoints:

### Register User
```
POST /api/auth/register
```
Request Body:
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123"
}
```

### Login
```
POST /api/auth/login
```
Request Body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "User Name",
      "email": "user@example.com"
    },
    "token": "jwt_token_here"
  }
}
```

### Get User Profile
```
GET /api/auth/profile
```
Headers:
```
Authorization: Bearer <jwt_token>
```

## User Management API

### Get User by ID
```
GET /api/users/:id
```
Headers:
```
Authorization: Bearer <jwt_token>
```

### Update User
```
PUT /api/users/:id
```
Headers:
```
Authorization: Bearer <jwt_token>
```
Request Body:
```json
{
  "name": "Updated Name"
}
```

### Delete User
```
DELETE /api/users/:id
```
Headers:
```
Authorization: Bearer <jwt_token>
```

## Database Migrations

```bash
# Run migrations
pnpm run db:migrate

# Seed the database
pnpm run db:seed:all
```

## Frontend Application

The React frontend is located in the `client` directory and is built with:

- React 18+
- TypeScript
- Vite

### Features

- Connects to the backend API through a proxy configuration
- Interactive UI for testing API endpoints
- Modern, responsive design

### Building for Production

```bash
# Build both frontend and backend
pnpm run build

# Build only the frontend
pnpm run dev
```
