[![CI](https://github.com/stewie1520/node-sequelize/actions/workflows/ci.yml/badge.svg)](https://github.com/stewie1520/node-sequelize/actions/workflows/ci.yml)

# Node.js Sequelize Boilerplate

A modern, production-ready boilerplate for Node.js applications using Sequelize ORM, Hono.js, and TypeScript.

## Features

- **TypeScript** - Type-safe code development
- **Hono.js** - Lightweight, ultrafast web framework
- **Sequelize ORM** - SQL database ORM with migrations support
- **Redis** - In-memory data store for caching and session management
- **Socket.IO** - Real-time communication with clients
- **PostgreSQL** - Robust relational database
- **Docker** - Containerized development environment
- **Logging** - Winston logger implementation
- **Code Quality** - ESLint, Husky, and Commitlint setup
- **Hot Reloading** - Fast development with tsx watch

## Prerequisites

- Node.js (v18+)
- pnpm
- Docker and Docker Compose (for local development)

## Getting Started

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd node-sequelize

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Database Setup

```bash
# Start PostgreSQL container
docker-compose up -d

# Run migrations
pnpm db:migrate

# (Optional) Seed the database
pnpm db:seed:all
```

### Development

```bash
# Start development server with hot reloading
pnpm dev
```

The server will be available at http://localhost:3000 (or the port specified in your .env file).

## API Documentation

API documentation is available at http://localhost:3000/api when the server is running.

## Database Management

```bash
# Generate a new migration
pnpm migration:generate my-migration-name

# Run migrations
pnpm db:migrate

# Undo the most recent migration
pnpm db:migrate:undo

# Undo all migrations
pnpm db:migrate:undo:all

# Run seeders
pnpm db:seed:all

# Undo seeders
pnpm db:seed:undo:all
```

## Main Technologies

This boilerplate uses modern JavaScript/TypeScript libraries and frameworks:

- **[Hono.js](https://hono.dev/)** - Lightweight, ultrafast web framework for the edge
- **[Sequelize](https://sequelize.org/)** - Promise-based Node.js ORM for PostgreSQL, MySQL, and more
- **[Socket.IO](https://socket.io/)** - Real-time communication with clients
- **[Redis](https://redis.io/)** - In-memory data structure store
- **[TypeScript](https://www.typescriptlang.org/)** - Typed superset of JavaScript
- **[PostgreSQL](https://www.postgresql.org/)** - Advanced open-source relational database
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation with static type inference
- **[JWT](https://jwt.io/)** - JSON Web Token for secure authentication
- **[Winston](https://github.com/winstonjs/winston)** - Multi-transport async logging library
- **[Docker](https://www.docker.com/)** - Containerization platform
- **[ESLint](https://eslint.org/)** - Pluggable JavaScript linter
- **[Husky](https://typicode.github.io/husky/)** - Git hooks made easy
- **[Commitlint](https://commitlint.js.org/)** - Lint commit messages

## Project Structure

```
├── src/
│   ├── config/         # Configuration files
│   ├── database/       # Database related files
│   │   ├── migrations/ # Sequelize migrations
│   │   └── seeders/    # Database seeders
│   ├── middleware/     # Hono middleware
│   ├── models/         # Sequelize models
│   ├── routes/         # API routes
│   ├── schemas/        # Zod validation schemas
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── index.ts        # Application entry point
├── .env.example        # Example environment variables
├── .eslintignore       # ESLint ignore configuration
├── .gitignore          # Git ignore configuration
├── .husky/             # Git hooks configuration
├── .sequelizerc        # Sequelize CLI configuration
├── commitlint.config.js # Commitlint configuration
├── docker-compose.yaml # Docker Compose configuration
├── eslint.config.js    # ESLint configuration
├── package.json        # Project dependencies
└── tsconfig.json       # TypeScript configuration
```

## Scripts

- `pnpm dev` - Start development server with hot reloading
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint errors

## Contributing

1. Follow the commit message convention using Commitlint
2. Make sure all tests pass
3. Ensure your code lints without errors

## License

MIT
