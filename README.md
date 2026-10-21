# Gamers.SG

Gamers.SG is designed as a professional networking platform catered towards the Esports/Gaming Community in Singapore, developed under Singapore Cybersports and Online Gaming Association (SCOGA).

The platform is designed as a verified identity and services hub for the gaming community, bringing together gamer profiles, achievements, team management, tournaments, career opportunities, and member-focused services.

## Features

- Verified gamer memberships and profiles
- Competitive gaming profiles and achievements
- Team and organization management
- Tournament discovery and participation
- Gaming-related jobs and opportunities

## Technology Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS v4, Radix UI
- **Backend:** NestJS 11, Passport, JWT
- **Database:** PostgreSQL with Prisma ORM
- **Language:** TypeScript
- **Monorepo:** Turborepo and pnpm workspaces
- **Validation:** Zod, class-validator, and class-transformer
- **Email:** Resend

## Repository Structure

```text
GamersSG/
├── apps/
│   ├── backend/          # NestJS API server
│   └── frontend/         # Next.js web application
├── packages/
│   ├── database/         # Prisma schema, client, and seed scripts
│   └── shared/           # Shared types, DTOs, enums, and constants
├── scripts/
│   └── dev-setup.sh      # Development environment setup script
├── turbo.json            # Turborepo task configuration
├── tsconfig.base.json    # Shared TypeScript configuration
└── pnpm-workspace.yaml   # pnpm workspace configuration
```

## Requirements

- Node.js `>= 22.0.0`
- pnpm `10.15.1`
- PostgreSQL

The required pnpm version is specified in the root `package.json`. If pnpm is not installed, enable it through Corepack:

```bash
corepack enable pnpm
corepack prepare pnpm@10.15.1 --activate
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Rocctin/GamersSG.git
cd GamersSG
```

### 2. Run the setup script

The setup script installs dependencies, creates local environment files, prepares the database, generates the Prisma client, and seeds the initial data.

```bash
pnpm setup
```

The script expects PostgreSQL to be available locally. You can override the default database settings before running it:

```bash
export PGUSER=postgres
export PGPASSWORD=your_password
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=gamers_sg
pnpm setup
```

### 3. Start the development servers

Run the backend and frontend together:

```bash
pnpm dev
```

Or run them individually:

```bash
pnpm --filter @gamers-sg/backend dev
pnpm --filter @gamers-sg/frontend dev
```

The development servers are available at:

- Frontend: <http://localhost:3001>
- Backend API: <http://localhost:3000/api>

## Environment Variables

The setup script creates the following files:

- `packages/database/.env`
- `apps/backend/.env`
- `apps/frontend/.env.local`

### Backend and database variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign JWTs; must be at least 32 characters |
| `RESEND_API_KEY` | Resend API key used for email delivery |
| `FRONTEND_URL` | Frontend URL used for CORS and authentication links |
| `PORT` | Backend port; defaults to `3000` |
| `NODE_ENV` | Runtime environment: `development`, `production`, or `test` |

### Frontend variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL, usually `http://localhost:3000/api` |

Never commit real secrets or local environment files to the repository.

## Common Commands

### Development and builds

```bash
pnpm dev       # Run all development applications
pnpm build     # Build all packages and applications
pnpm lint      # Run lint tasks across the monorepo
```

### Database

```bash
pnpm db:generate   # Generate the Prisma client
pnpm db:push       # Push the Prisma schema to the database
pnpm db:migrate    # Create and apply a Prisma migration
pnpm db:seed       # Seed the default admin user
pnpm db:demo       # Seed demo user accounts
pnpm db:studio     # Open Prisma Studio
pnpm db:reset      # Reset the database and delete all data
```

Database commands are backed by the `@gamers-sg/database` workspace package.

## Backend API

The NestJS backend uses the `/api` global prefix. In local development, the API base URL is:

```text
http://localhost:3000/api
```

The backend includes global authentication, role-based authorization, rate limiting, request validation, CORS configuration, and consistent HTTP error responses.

## Database

Prisma is used to manage the database schema and generated client. The database package exposes a Prisma client singleton to avoid creating multiple client instances during development.

For schema changes, use the following workflow:

```bash
# Edit the Prisma schema, then validate and format it
pnpm --filter @gamers-sg/database db:validate
pnpm --filter @gamers-sg/database db:format

# Apply changes during development
pnpm db:migrate

# Or push the schema without creating a migration
pnpm db:push
```

## Project Development

When contributing changes:

1. Create a feature branch from `main`.
2. Install dependencies with `pnpm install` or initialize the environment with `pnpm setup`.
3. Run the relevant development server and database services.
4. Run `pnpm build` and `pnpm lint` before opening a pull request.
5. Keep shared types and DTOs in `packages/shared` when they are used by both applications.
