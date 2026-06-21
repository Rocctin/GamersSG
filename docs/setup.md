# Gamers.SG — Development Setup Guide

## Prerequisites

### External Applications

| Application | Minimum Version | Purpose | Install Link |
|---|---|---|---|
| **Node.js** | >= 22.0.0 | JavaScript runtime | https://nodejs.org |
| **pnpm** | 10.15.1 | Package manager (enforced via `packageManager` field) | Enabled via `corepack enable pnpm` |
| **PostgreSQL** | 16+ | Relational database | https://www.postgresql.org/download/windows/ |

**Windows notes:**
- PostgreSQL installer: https://www.postgresql.org/download/windows/
- After installing PostgreSQL, ensure the `psql` binary is in your PATH
- Node.js can be installed via the official installer or `winget install OpenJS.NodeJS.LTS`

### Verify Installation

```bash
node --version    # must show v22.x.x or later
pnpm --version    # must show 10.15.1 or later
psql --version    # must show 16.x or later
```

## One-Command Setup

```bash
pnpm setup
```

This runs `scripts/dev-setup.sh` which:
1. Checks prerequisites (Node.js, pnpm, PostgreSQL)
2. Installs all dependencies via `pnpm install`
3. Creates `.env` files from templates if they don't exist
4. Pushes the Prisma schema to PostgreSQL (`pnpm db:push`)
5. Generates the Prisma client (`pnpm db:generate`)
6. Seeds the database with an admin user (`pnpm db:seed`)

## Manual Setup (if `pnpm setup` fails)

### 1. Create the PostgreSQL database via PGAdmin 4

```sql
CREATE DATABASE gamers_sg;
```

### 2. Environment files

Create `apps/backend/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/gamers_sg
JWT_SECRET=dev-jwt-secret-change-in-production-0123456789abcdef0123456789abcdef
RESEND_API_KEY=re_placeholder
FRONTEND_URL=http://localhost:3001
PORT=3000
NODE_ENV=development
```

Create `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Set up database schema and seed

```bash
pnpm db:push        # Push Prisma schema to PostgreSQL
pnpm db:generate    # Generate Prisma client
pnpm db:seed        # Seed admin user
```

## Environment Variables Reference

| Variable | Location | Purpose | Required |
|---|---|---|---|
| `DATABASE_URL` | `apps/backend/.env` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | `apps/backend/.env` | JWT signing secret (min 32 chars) | Yes |
| `RESEND_API_KEY` | `apps/backend/.env` | Resend API key for magic link emails | Yes (use `re_placeholder` in dev) |
| `FRONTEND_URL` | `apps/backend/.env` | Frontend URL for CORS + magic link construction | Yes |
| `PORT` | `apps/backend/.env` | Backend port | No (defaults to `3000`) |
| `NODE_ENV` | `apps/backend/.env` | `development` / `production` / `test` | No (defaults to `development`) |
| `NEXT_PUBLIC_API_URL` | `apps/frontend/.env.local` | Backend API URL for the frontend | Yes |
| `SEED_ADMIN_EMAIL` | (optional) | Override default admin email for seeding | No |

Backend env validation uses Zod in `apps/backend/src/config/configuration.ts` — the app exits on startup if required vars are missing or invalid.

## Running the Application

### Creating demo data

```bash

# Creating demo data
pnpm db:demo
```
# Creates 10 Accounts

```bash
#Creating demo data while specifiy directory
pnpm --filter @gamers-sg/database db:demo
```

### Run both backend and frontend together

```bash
pnpm dev
```

This uses Turborepo to start both apps concurrently.

### Run individually (two terminals)

```bash
# Terminal 1 — Backend API
pnpm --filter @gamers-sg/backend dev

# Terminal 2 — Frontend
pnpm --filter @gamers-sg/frontend dev
```

| Service | URL | Port |
|---|---|---|
| Backend API | http://localhost:3000 | 3000 |
| Frontend | http://localhost:3001 | 3001 |

The API is available at `http://localhost:3000/api`.

## Additional Commands

| Command | Purpose |
|---|---|
| `pnpm build` | Build all packages for production |
| `pnpm lint` | Lint all packages |
| `pnpm db:studio` | Open Prisma Studio GUI to browse/edit data |
| `pnpm db:reset` | **WARNING**: Deletes all data and recreates schema |
| `pnpm --filter @gamers-sg/database db:validate` | Validate Prisma schema without generating |
| `pnpm --filter @gamers-sg/database db:format` | Format Prisma schema file |
