# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gamers.SG** is a national digital membership platform for gamers in Singapore, developed under the stewardship of SCOGA (Singapore Cybersports and Online Gaming Association). Think of it as "LinkedIn for gamers" — a verified identity and services hub combining competitive gaming profiles, achievements, team management, tournaments, a jobs board, and members-only e-commerce.

**Current Phase**: Phase 1 — Authentication, RBAC, and database foundation.
- Backend: NestJS + Prisma + PostgreSQL
- Frontend: Next.js 15 (App Router) + Tailwind CSS v4 + Radix UI
- Monorepo: Turborepo + pnpm workspaces with shared types/DTOs

**Key Strategic Pillars**:
- **Monetization**: Annual membership subscription model
- **Data Authenticity**: SingPass/Myinfo integration for verified, one-person-one-account identity
- **Ecosystem Value**: Interconnected features creating compounding value for gamers, organisers, and partners

## Monorepo Structure

```
gamers-sg/
├── apps/
│   ├── backend/          # NestJS API server (port 3000)
│   └── frontend/         # Next.js 15 App Router (port 3001)
├── packages/
│   ├── database/         # Prisma schema, client singleton, seed
│   └── shared/           # Shared TS types, DTOs, enums, constants
├── scripts/
│   └── dev-setup.sh      # One-command dev environment setup
├── turbo.json            # Turborepo pipeline config
├── tsconfig.base.json    # Shared TS compiler options
└── pnpm-workspace.yaml   # pnpm workspace definition
```

Package references use `workspace:*` protocol. Frontend Next.js uses `transpilePackages: ["@gamers-sg/shared"]` to handle the workspace package.

## Development Commands

```bash
# One-time setup (install deps, create .env files, push schema, seed DB)
pnpm setup

# Run both backend + frontend (uses Turborepo)
pnpm dev

# Run individually
pnpm --filter @gamers-sg/backend dev      # Backend on :3000
pnpm --filter @gamers-sg/frontend dev     # Frontend on :3001

# Build all packages
pnpm build

# Lint all packages
pnpm lint
```

### Database Commands

All database commands are defined in `packages/database/package.json` and proxied from root `package.json`:

```bash
pnpm db:generate    # prisma generate — regenerate Prisma Client after schema changes
pnpm db:push        # prisma db push — push schema to DB (no migration file)
pnpm db:migrate     # prisma migrate dev — create + apply a named migration
pnpm db:seed        # tsx prisma/seed.ts — seed admin user
pnpm db:studio      # prisma studio — open Prisma Studio GUI
pnpm db:reset       # prisma migrate reset — WARNING: deletes all data
```

Additional database commands are available via the database package filter (not proxied at root):

```bash
pnpm --filter @gamers-sg/database db:validate   # prisma validate — check schema
pnpm --filter @gamers-sg/database db:format     # prisma format — format schema
```

The database package exports a PrismaClient singleton from `@gamers-sg/database` (prevents multiple instances in dev via `globalThis`).

## Environment Variables

Required env vars (see `.env.example` at root):

| Variable | Location | Purpose |
|---|---|---|
| `DATABASE_URL` | `packages/database/.env` + `apps/backend/.env` | PostgreSQL connection string |
| `JWT_SECRET` | `apps/backend/.env` | JWT signing secret (min 32 chars) |
| `RESEND_API_KEY` | `apps/backend/.env` | Resend API key for magic link emails |
| `FRONTEND_URL` | `apps/backend/.env` | Frontend URL for CORS + magic link construction |
| `PORT` | `apps/backend/.env` | Backend port (default 3000) |
| `NODE_ENV` | `apps/backend/.env` | `development` / `production` / `test` |
| `NEXT_PUBLIC_API_URL` | `apps/frontend/.env.local` | Backend API URL for the frontend |
| `SEED_ADMIN_EMAIL` | optional | Override default admin email for seeding |

Env validation uses Zod in `apps/backend/src/config/configuration.ts` — the app exits on startup if required vars are missing.

## Backend Architecture (NestJS)

### Module Structure

```
src/
├── app.module.ts              # Root module — imports all feature modules
├── main.ts                    # Bootstrap: cookieParser, CORS, globalPrefix "api"
├── config/configuration.ts     # Zod-based env validation
├── prisma/
│   ├── prisma.module.ts       # @Global() module, exports PrismaService
│   └── prisma.service.ts      # Extends PrismaClient, connects on init
├── common/
│   ├── decorators/
│   │   ├── public.decorator.ts     # @Public() — skips JWT guard
│   │   ├── roles.decorator.ts      # @Roles(Role.ADMIN) — RBAC metadata
│   │   ├── current-user.decorator.ts  # @CurrentUser() — extracts JWT payload from request
│   │   └── rate-limit.decorator.ts     # @RateLimit(config) — configures per-endpoint rate limits
│   ├── guards/
│   │   ├── jwt-auth.guard.ts       # Global guard: checks JWT unless @Public()
│   │   ├── roles.guard.ts          # Global guard: checks @Roles() metadata
│   │   └── rate-limit.guard.ts     # Per-route guard: DB-backed rate limiting, configurable via @RateLimit() decorator
│   └── filters/
│       └── http-exception.filter.ts # Global filter: wraps errors as { success, error }
└── modules/
    ├── auth/                  # Magic link request/verify/refresh/logout
    │   ├── auth.module.ts     # JwtModule.registerAsync, AuditModule import
    │   ├── auth.controller.ts # /api/auth/* endpoints
    │   ├── auth.service.ts    # Token generation, verification, rotation
    │   ├── email/email.service.ts  # Resend integration
    │   ├── templates/magic-link.ts # HTML email template
    │   └── strategies/jwt.strategy.ts  # Passport JWT strategy
    ├── users/                 # User profiles
    │   ├── users.module.ts
    │   ├── users.controller.ts    # /api/users/* endpoints
    │   ├── users.service.ts       # Profile fetch with visibility handling
    │   └── profiles/
    │       ├── gamer-profile.service.ts      # Gamer profile CRUD, username throttle
    │       └── organiser-profile.service.ts  # Organiser profile CRUD + admin review
    ├── admin/                 # Admin panel endpoints
    │   ├── admin.module.ts
    │   ├── admin.controller.ts    # All routes require @Roles(Role.ADMIN)
    │   └── admin.service.ts       # User management, organiser review, audit log retrieval
    └── audit/
        ├── audit.module.ts    # Exports AuditService to Auth + Admin modules
        └── audit.service.ts   # Insert-only audit log writer (never throws)
```

### Key Patterns

- **Guards run globally**: `JwtAuthGuard` and `RolesGuard` are registered as `APP_GUARD` in `AppModule`. Use `@Public()` to bypass JWT; use `@Roles()` to require specific roles. If no `@Roles()` is set, all authenticated users can access.
- **Prisma is global**: `PrismaModule` is `@Global()` so all services inject `PrismaService` without importing the module.
- **Response format**: All errors go through `HttpExceptionFilter`, which outputs `{ success: false, error: { code, message, details? } }`.
- **Rate limiting**: `RateLimitGuard` is applied per-route via the `@RateLimit()` decorator, which accepts `{ windowMinutes, maxAttempts, keyPrefix }`. The guard keys by IP for decorator-configured endpoints; legacy endpoints without the decorator fall back to email-based keys. DB-backed (`RateLimitBucket` table). Replace with Redis at scale.

  Current rate limits:
  | Endpoint | Window | Max Attempts | Key |
  |---|---|---|---|
  | `POST /auth/magic-link/request` | 15 min | 5 | email (legacy) |
  | `POST /auth/magic-link/verify` | 15 min | 10 | IP |
  | `POST /auth/refresh` | 5 min | 20 | IP |
  | `GET /users/:id` | 1 min | 30 | IP |

## Authentication Flow

### Magic Link → JWT + Refresh Token

1. User submits email → `POST /api/auth/magic-link/request`
2. System upserts user (auto-creates `GAMER`/`APPROVED` if new), generates 128-char hex token, hashes with SHA-256, stores in `AuthToken`, sends email via Resend
3. Previous unused tokens for that user are invalidated (single active link at a time)
4. User clicks link → `POST /api/auth/magic-link/verify` with raw token
5. System validates: token exists, unused, not expired, user not suspended
6. Returns JWT access token (15-min expiry) + user profile in response body
7. Sets **two** `httpOnly` cookies:
   - `refresh_token` (30-day expiry) at path `/api/auth` — sent only to auth endpoints
   - `access_token` (15-min expiry) at path `/` — readable by Next.js middleware for route protection
8. Refresh token is stored in DB as SHA-256 hash for individual revocation

### Session Persistence (Refresh Token Rotation)

- `POST /api/auth/refresh` — reads `refresh_token` cookie, validates, revokes old token, issues new pair (rotation)
- `POST /api/auth/logout` — revokes the refresh token, clears cookie
- Admin can revoke all refresh tokens for a suspended user (`authService.revokeAllUserTokens()`)
- JWT strategy also checks user existence + suspended status on every authenticated request

### Backend → Frontend Token Flow

Both tokens are set as `httpOnly`, `sameSite: "lax"` cookies (not accessible to JS) by the backend:
- `refresh_token` — path `/api/auth`, 30-day expiry, sent only on auth API calls
- `access_token` — path `/`, 15-min expiry, sent on all requests (readable by Next.js middleware)

The frontend also stores the **access token in memory** (via `api-client.ts`) to attach it as an `Authorization: Bearer` header on API requests — this is the token the backend actually verifies cryptographically. The `access_token` cookie is used only by the Next.js middleware for client-side route gating (see Middleware section).

On page load, `AuthProvider` calls `POST /api/auth/refresh` (which sends the `refresh_token` cookie) to restore the session. The refresh endpoint also rotates both cookies and returns a fresh access token in the response body.

## Frontend Architecture (Next.js 15 App Router)

### Route Groups

```
src/app/
├── layout.tsx                      # Root: AuthProvider + Toaster, dark theme
├── page.tsx                        # Landing page
├── (auth)/                         # Public routes
│   ├── login/page.tsx              # Email → magic link request
│   └── verify/page.tsx             # Token verification from magic link URL
└── (dashboard)/                    # Protected routes (redirects to /login if unauthenticated)
    ├── layout.tsx                  # Auth guard + DashboardLayout wrapper
    ├── dashboard/page.tsx          # Welcome card + quick links
    ├── profile/page.tsx            # User profile
    ├── settings/page.tsx           # Account settings
    └── admin/                      # Admin-only routes (@Roles(ADMIN) enforced by API)
        ├── layout.tsx
        ├── page.tsx
        ├── users/page.tsx
        ├── organisers/page.tsx
        └── audit-logs/page.tsx
```

### Auth Client Architecture

```
AuthProvider (React Context)
  ├── On mount: tries POST /auth/refresh (sends cookies automatically via withCredentials)
  ├── On success: stores access token in memory (for Authorization header) + sets user + isAuthenticated
  ├── On failure: clears state, user sees login page
  └── Provides: user, isLoading, isAuthenticated, requestMagicLink, verifyToken, logout

apiClient (Axios instance)
  ├── Request interceptor: attaches `Authorization: Bearer <accessToken>`
  ├── Response interceptor on 401:
  │   ├── Queues concurrent requests during refresh
  │   ├── Calls /auth/refresh (with cookie)
  │   ├── Retries queued requests with new token
  │   └── On refresh failure: clears token, redirects to /login
  └── withCredentials: true (sends cookies automatically)
```

### Next.js Middleware (Route Protection)

A `middleware.ts` at the frontend root runs before page JS loads and provides a fast client-side gate:

- **Protected routes** (`/dashboard/*`, `/profile/*`, `/settings/*`, `/admin/*`): redirects to `/login?redirect=<path>` if no `access_token` cookie is present
- **Admin routes** (`/admin/*`): decodes the `access_token` JWT using `jose` (decode only — no signature verification) and checks `claims.role === "ADMIN"`. Non-admin users are redirected to `/dashboard`
- **Caveat**: Middleware JWT decoding is NOT cryptographic verification. The backend enforces actual auth on every API call. A forged cookie with a fake role would render empty page shells without data.

The middleware prevents non-ADMIN users from ever downloading the admin component tree, and unauthenticated users from downloading protected pages.

### Key Components

- `DashboardLayout` — responsive sidebar + header layout. Sidebar is fixed on desktop, slide-over on mobile.
- `Header` — sticky top bar with user menu dropdown (profile, settings, admin link if ADMIN, sign out)
- `Sidebar` — navigation links with active state highlighting. Admin-only items (Users, Organisers, Audit Logs) shown conditionally via `isAdmin()` check.
- `useAuth()` hook — re-exports `useAuthContext()` from `@/hooks/use-auth`

### UI Stack

- **Tailwind CSS v4** (not v3 — uses `@tailwindcss/postcss` plugin, CSS-based config)
- **Radix UI** primitives: Dialog, DropdownMenu, Slot, Avatar, Label, Select
- **No shadcn/ui** — Radix primitives are used directly with custom styling
- **Lucide React** for icons
- **Sonner** for toast notifications
- **react-hook-form** + **zod** for form validation
- **class-variance-authority** + **tailwind-merge** + **clsx** via `cn()` utility in `@/lib/utils`
- **jose** for JWT decoding in Next.js middleware (decode only — signature verification is backend-side)

## Shared Package (`@gamers-sg/shared`)

Exports via subpath patterns defined in `package.json`:

| Import path | Contents |
|---|---|
| `@gamers-sg/shared` | Everything (enums, types, DTOs, constants) |
| `@gamers-sg/shared/dto` | `UserProfileDto`, `AuthTokensResponse`, `ReviewOrganiserDto`, `UpdateUserStatusDto`, etc. |
| `@gamers-sg/shared/enums` | Re-exports `Role`, `AccountStatus`, `AuditAction` from `@gamers-sg/database` |
| `@gamers-sg/shared/types` | `JwtPayload`, `ApiResponse<T>`, `PaginatedResponse<T>`, `PaginationQueryDto` |
| `@gamers-sg/shared/constants` | `AUTH` (token expiry, username cooldown), `RATE_LIMITS`, `PAGINATION` |

**Note**: The enums file re-exports Prisma enums so consumers don't need a direct dependency on `@gamers-sg/database` just for enums.

## Database Schema Conventions

- **UUID PKs**: All tables use `@default(uuid()) @db.Uuid`
- **Timestamps**: All use `@db.Timestamptz` (PostgreSQL `timestamptz`)
- **Cascade deletes**: User deletion cascades to profiles, tokens (no orphaned data)
- **Snake case in DB**: `snake_case` column names (e.g., `user_id`, `created_at`) mapped to camelCase in TypeScript via Prisma
- **Indexes**: Defined on frequently queried columns (email, role+status, token hashes, audit timestamps)
- **One Person, One Account**: `nric_hash` has a unique constraint (currently nullable, enforced when SingPass is integrated)

### Key Schema Details

- `AuthToken.token_hash` — SHA-256 hash of the raw 128-char hex token. The raw token never hits the DB.
- `RefreshToken.token_hash` — same hashing pattern. Stored in DB so each token can be individually revoked.
- `GamerProfile.username` — unique, with `username_changed_at` for 90-day throttle enforcement.
- `OrganiserProfile` — has admin review fields (`reviewed_by`, `reviewed_at`, `rejection_reason`).
- `AuditLog` — insert-only. Uses `@relation()` attributes to link actor and target to the `User` table.

## Development Workflow Patterns

### Changing the Database Schema
1. Edit `packages/database/prisma/schema.prisma`
2. `pnpm db:generate` — regenerate Prisma Client (also available: `pnpm db:migrate` for named migrations)
3. Update relevant DTOs in `packages/shared/src/dto/` if the API surface changes
4. Update backend services/controllers that use the changed fields
5. Update frontend forms/display

### Adding a New Audit Action
1. Add enum value to `AuditAction` in `schema.prisma`
2. Regenerate client (`pnpm db:generate`) and push schema
3. Use `AuditService.log()` — errors are caught internally, never crash the caller:
   ```typescript
   constructor(private readonly auditService: AuditService) {}
   
   await this.auditService.log({
     actorId: adminUser.id,
     action: AuditAction.NEW_ACTION,
     targetId: targetUser.id,
     targetType: "user",
     metadata: { reason: "...", oldValue: "...", newValue: "..." },
     ipAddress: req.ip,
   });
   ```

### Suspending a User
1. Update `User.status` to `SUSPENDED`
2. Call `authService.revokeAllUserTokens(userId)` — sets `revoked_at` on all active refresh tokens
3. Create `AuditLog` with `USER_SUSPENDED` action
4. Never delete the user record (the JWT strategy also checks `status !== SUSPENDED`)

### Adding a New Protected API Endpoint
- All endpoints are protected by default (global `JwtAuthGuard`)
- Use `@Public()` decorator for unauthenticated routes
- Use `@Roles(Role.ADMIN)` (or `Role.GAMER`, `Role.ORGANISER`) for role-restricted routes
- Use `@CurrentUser()` to get the authenticated user's JWT payload (`{ sub, email, role }`)
- No `@Roles()` = accessible by any authenticated user

## Role-Based Access Control

| Role | Access |
|---|---|
| `GAMER` | Dashboard, own profile, own gamer profile management |
| `ORGANISER` | Dashboard, own profile, organiser profile CRUD |
| `ADMIN` | All of the above + admin panel: user management, organiser approval/rejection, audit log viewer |

During organiser profile creation, the user's status is set to `PENDING`. An admin must review and approve/reject via `POST /api/admin/organisers/:userId/review`. If rejected, updating the profile resets status to `PENDING` for re-review.

## Out of Scope for V1.0

- Native iOS/Android apps (responsive web only)
- In-platform messaging/chat
- Social feed or content publishing
- Live bracket management
- Matchmaking or team-finding algorithms
- Integrated streaming/VOD
- Multi-language support (English only)
- Tests (test infrastructure not yet set up)

## Future Integration Points

- **SingPass/Myinfo**: OAuth 2.0 / OpenID Connect via [api.singpass.gov.sg](https://api.singpass.gov.sg). 4-8 week approval as a Relying Party.
- **Payment Gateway**: Stripe (SGD), HitPay (PayNow), or Braintree. PCI-DSS — never store card data.
- **Email**: Resend (current). Verified sending domain: `@gamers.sg`.
- **File Storage**: AWS S3, GCS, or Cloudflare R2 with CDN for avatars, banners, product images.

## Critical Decisions Pending (SCOGA)

- Annual membership pricing (monthly option?)
- Organiser listing fees (if any)
- Jobs board listing fees (if any)
- Points expiry policy (currently 24-month expiry TBD)
- Minimum cash payment in store (can points offset 100%?)
- Physical goods fulfilment logistics (in-house or partner-managed?)
- SingPass Relying Party application status
