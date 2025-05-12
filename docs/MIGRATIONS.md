# Database Migration Guide

This document provides a comprehensive guide on using the database migration system in the My First Electric project.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Migration Commands](#migration-commands)
- [Working with Migrations](#working-with-migrations)
  - [Generating Migrations](#generating-migrations)
  - [Running Migrations](#running-migrations)
  - [Reverting Migrations](#reverting-migrations)
  - [Seeding Data](#seeding-data)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

This project uses Sequelize CLI to manage database migrations. Migrations allow you to evolve your database schema over time, making incremental changes while keeping track of the schema version.

## Prerequisites

- Node.js and pnpm installed
- PostgreSQL database accessible with credentials in your `.env` file
- Project dependencies installed (`pnpm install`)

## Migration Commands

The following pnpm scripts are available for managing migrations:

| Command | Description |
|---------|-------------|
| `pnpm run migration:generate -- migration-name` | Generate a new migration file |
| `pnpm run db:migrate` | Run all pending migrations |
| `pnpm run db:migrate:undo` | Revert the most recent migration |
| `pnpm run db:migrate:undo:all` | Revert all migrations |
| `pnpm run db:seed:all` | Run all seed files |
| `pnpm run db:seed:undo` | Revert the most recent seed |
| `pnpm run db:seed:undo:all` | Revert all seeds |

## Working with Migrations

### Generating Migrations

To create a new migration file:

```bash
pnpm run migration:generate -- create-new-table
```

This will generate a new file in `src/database/migrations` with a timestamp prefix and the name you specified. The file will contain `up` and `down` methods where you can define your schema changes.

### Running Migrations

To apply all pending migrations to the database:

```bash
pnpm run db:migrate
```

This will execute all migration files that haven't been run yet, in chronological order.

### Reverting Migrations

To revert the most recently applied migration:

```bash
pnpm run db:migrate:undo
```

To revert all migrations and return to the initial state:

```bash
pnpm run db:migrate:undo:all
```

### Seeding Data

Seed files can be used to populate your database with initial or test data.

Generate a seed file:

```bash
npx sequelize-cli seed:generate --name demo-users
```

This creates a file in `src/database/seeders`.

Run all seed files:

```bash
pnpm run db:seed:all
```

## Best Practices

1. **Keep migrations small and focused**: Each migration should make a small, specific change to the database.

2. **Test migrations**: Always test your migrations on a development database before applying them to production.

3. **Version control**: Always commit migration files to your version control system.

4. **Use meaningful names**: Give your migrations descriptive names that reflect what they do.

5. **Use the down method effectively**: Make sure your `down` method properly reverts everything done in the `up` method.

6. **Be careful with production data**: For production environments, make sure migrations don't destroy or compromise existing data.

## Troubleshooting

### Migration Failed

If a migration fails:

1. Check the error message for details
2. Fix the issues in your migration file
3. If the migration was partially applied, you may need to manually fix the database state before retrying

### SequelizeMeta Table Issues

The `SequelizeMeta` table tracks which migrations have been applied. If this table gets corrupted:

```bash
# Approach 1: Start fresh (warning: this will require rebuilding your database)
pnpm run db:migrate:undo:all
pnpm run db:migrate

# Approach 2: Manually edit the SequelizeMeta table
# (advanced users only, use with caution)
```

### Connection Issues

If you encounter database connection issues:

1. Verify your `.env` file has the correct database credentials
2. Check that your database server is running
3. Ensure network connectivity to the database server

For more help, refer to the [Sequelize CLI documentation](https://github.com/sequelize/cli).
