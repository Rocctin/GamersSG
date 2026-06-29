#!/usr/bin/env bash
set -euo pipefail

echo "================================================"
echo "  Gamers.SG — Development Environment Setup"
echo "================================================"
echo ""

# ---- Configurable DB credentials ----
# Override via environment variables before running this script:
#   export PGUSER=postgres PGPASSWORD=mypass PGHOST=localhost PGPORT=5432 PGDATABASE=gamers_sg
#   bash scripts/dev-setup.sh
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-password}"
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGDATABASE="${PGDATABASE:-gamers_sg}"
DATABASE_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}"

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
  echo "      Please install PostgreSQL and ensure it's running on port ${PGPORT}."
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

if [ ! -f "packages/database/.env" ]; then
  cat > packages/database/.env <<EOF
DATABASE_URL=${DATABASE_URL}
EOF
  echo "  ✅ Created packages/database/.env"
else
  echo "  ⚠️  packages/database/.env already exists — skipping"
fi

if [ ! -f "apps/backend/.env" ]; then
  JWT_SECRET="dev-jwt-secret-change-in-production-$(openssl rand -hex 16 2>/dev/null || echo "0123456789abcdef0123456789abcdef")"
  cat > apps/backend/.env <<EOF
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
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

if ! command -v psql &>/dev/null; then
  echo "  ⚠️  psql not available — skipping database setup."
  echo "      Once PostgreSQL is running, manually run:"
  echo "        pnpm db:push"
  echo "        pnpm db:generate"
  echo "        pnpm db:seed"
else
  # Verify we can connect before doing anything
  echo "  Checking database connection..."
  echo "  URL: ${DATABASE_URL}"

  if ! psql "$DATABASE_URL" -c "SELECT 1" &>/dev/null 2>&1; then
    echo ""
    echo "  ❌ Cannot connect to PostgreSQL at ${PGHOST}:${PGPORT} as ${PGUSER}."
    echo ""
    echo "  Troubleshooting:"
    echo "    1. Is PostgreSQL running?"
    echo "    2. Is the password correct? (current: '${PGPASSWORD}')"
    echo "    3. Is the port correct? (current: ${PGPORT})"

    # Try to create the database via the default 'postgres' database
    DEFAULT_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/postgres"
    if psql "$DEFAULT_URL" -c "CREATE DATABASE \"${PGDATABASE}\";" &>/dev/null 2>&1; then
      echo "  ✅ Database '${PGDATABASE}' created successfully"
    else
      echo ""
      echo "  To fix, set the correct credentials before re-running:"
      echo "    export PGUSER=postgres PGPASSWORD=your_password bash scripts/dev-setup.sh"
      echo ""
      echo "  Or edit the .env files manually:"
      echo "    packages/database/.env"
      echo "    apps/backend/.env"
      echo ""
      echo "  Then manually run:"
      echo "    pnpm db:push"
      echo "    pnpm db:generate"
      echo "    pnpm db:seed"
      echo ""
      echo "  ⚠️  Skipping remaining database steps."
      # Skip to done — don't run db:push with wrong credentials
      DB_SETUP_FAILED=1
    fi
  else
    echo "  ✅ Database is reachable"
  fi

  if [ -z "${DB_SETUP_FAILED:-}" ]; then
    # Push schema and generate client
    echo "  Pushing Prisma schema..."
    pnpm db:push

    echo "  Generating Prisma client..."
    pnpm db:generate

    # Seed database
    echo "  Seeding database..."
    pnpm db:seed

    echo "  ✅ Database setup complete"
  fi
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
echo ""
if [ -n "${DB_SETUP_FAILED:-}" ]; then
  echo "  ⚠️  Database setup was skipped due to connection failure."
  echo "  Once you fix the credentials, run:"
  echo "    pnpm db:push && pnpm db:generate && pnpm db:seed"
else
  echo "  💡 Tip: Run 'pnpm db:demo' to seed 10 demo user accounts."
fi
echo "================================================"
