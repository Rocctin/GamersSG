#!/usr/bin/env bash
set -euo pipefail

echo "================================================"
echo "  Gamers.SG — Development Environment Setup"
echo "================================================"
echo ""

# ---- Check prerequisites ----
echo "[1/5] Checking prerequisites..."

if ! command -v node &>/dev/null; then
  echo "  ❌ Node.js is not installed. Please install Node.js >=22 from https://nodejs.org"
  exit 1
fi
echo "  ✅ Node.js $(node --version)"

if ! command -v pnpm &>/dev/null; then
  echo "  ⚠️  pnpm not found. Installing via corepack..."
  corepack enable pnpm
  corepack prepare pnpm@10.15.1 --activate
fi
echo "  ✅ pnpm $(pnpm --version)"

if ! command -v psql &>/dev/null; then
  echo "  ⚠️  PostgreSQL (psql) not found in PATH."
  echo "      Please install PostgreSQL and ensure it's running on port 5432."
  echo "      Windows: https://www.postgresql.org/download/windows/"
  echo "      macOS:   brew install postgresql@16"
  echo "      Linux:   sudo apt install postgresql"
else
  echo "  ✅ PostgreSQL $(psql --version | head -1)"
fi

# ---- Install dependencies ----
echo ""
echo "[2/5] Installing dependencies..."
pnpm install

# ---- Environment files ----
echo ""
echo "[3/5] Setting up environment files..."

if [ ! -f "apps/backend/.env" ]; then
  cat > apps/backend/.env <<EOF
DATABASE_URL=postgresql://postgres:password@localhost:5432/gamers_sg
JWT_SECRET=dev-jwt-secret-change-in-production-0123456789abcdef0123456789abcdef
RESEND_API_KEY=re_placeholder
FRONTEND_URL=http://localhost:3001
PORT=3000
NODE_ENV=development
EOF
  echo "  ✅ Created apps/backend/.env"
else
  echo "  ⚠️  apps/backend/.env already exists — skipping"
fi

if [ ! -f "apps/frontend/.env.local" ]; then
  cat > apps/frontend/.env.local <<EOF
NEXT_PUBLIC_API_URL=http://localhost:3000/api
EOF
  echo "  ✅ Created apps/frontend/.env.local"
else
  echo "  ⚠️  apps/frontend/.env.local already exists — skipping"
fi

# ---- Database setup ----
echo ""
echo "[4/5] Setting up database..."

# Check if DATABASE_URL is reachable
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:password@localhost:5432/gamers_sg}"

if command -v psql &>/dev/null; then
  # Try to create database if it doesn't exist
  DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
  if ! psql "$DATABASE_URL" -c "SELECT 1" &>/dev/null 2>&1; then
    echo "  Creating database '$DB_NAME'..."
    # Try connecting to postgres default db to create our database
    DEFAULT_URL=$(echo "$DATABASE_URL" | sed 's/\/[^/]*$/\/postgres/')
    if psql "$DEFAULT_URL" -c "CREATE DATABASE \"$DB_NAME\";" &>/dev/null 2>&1; then
      echo "  ✅ Database '$DB_NAME' created"
    else
      echo "  ⚠️  Could not create database automatically."
      echo "      Please create it manually: CREATE DATABASE gamers_sg;"
    fi
  else
    echo "  ✅ Database is reachable"
  fi

  # Push schema and generate client
  echo "  Pushing Prisma schema..."
  pnpm db:push

  echo "  Generating Prisma client..."
  pnpm db:generate

  # Seed database
  echo "  Seeding database..."
  pnpm db:seed

  echo "  ✅ Database setup complete"
else
  echo "  ⚠️  psql not available — skipping database setup."
  echo "      Once PostgreSQL is running, manually run:"
  echo "        pnpm db:push"
  echo "        pnpm db:generate"
  echo "        pnpm db:seed"
fi

# ---- Done ----
echo ""
echo "[5/5] Setup complete!"
echo ""
echo "================================================"
echo "  To start developing:"
echo ""
echo "    Terminal 1:  pnpm --filter @gamers-sg/backend dev"
echo "    Terminal 2:  pnpm --filter @gamers-sg/frontend dev"
echo ""
echo "    Backend:   http://localhost:3000"
echo "    Frontend:  http://localhost:3001"
echo ""
echo "  Or run both together:"
echo "    pnpm dev"
echo "================================================"
