# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gamers.SG** is a national digital membership platform for gamers in Singapore, developed under the stewardship of SCOGA (Singapore Cybersports and Online Gaming Association). Think of it as "LinkedIn for gamers" — a verified identity and services hub combining competitive gaming profiles, achievements, team management, tournaments, a jobs board, and members-only e-commerce.

- Backend: NestJS + Prisma + PostgreSQL
- Frontend: Next.js 15 (App Router) + Tailwind CSS v4 + Radix UI
- Monorepo: Turborepo + pnpm workspaces with shared types/DTOs

**Runtime requirements**: Node.js >= 22.0.0, pnpm 10.15.1 (via `packageManager` in root `package.json`).

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

Package references use `workspace:*`. Frontend Next.js uses `transpilePackages: ["@gamers-sg/shared"]`.

## Development Commands

```bash
pnpm setup          # One-time: install deps, create .env, push schema, seed DB
pnpm dev            # Run backend + frontend (Turborepo)

# Individual dev servers
pnpm --filter @gamers-sg/backend dev      # Backend on :3000
pnpm --filter @gamers-sg/frontend dev     # Frontend on :3001

pnpm build          # Build all packages
pnpm lint           # Lint all packages
```

### Database Commands

All root-level DB commands proxy to `packages/database/package.json`:

```bash
pnpm db:generate    # prisma generate — regenerate Prisma Client
pnpm db:push        # prisma db push — push schema to DB (no migration)
pnpm db:migrate     # prisma migrate dev — create + apply named migration
pnpm db:seed        # tsx prisma/seed.ts — seed admin user
pnpm db:demo        # tsx prisma/demo-data.ts — seed 10 demo accounts
pnpm db:studio      # prisma studio — open Prisma Studio GUI
pnpm db:reset       # prisma migrate reset — WARNING: deletes all data
```

Additional commands (not proxied at root):
```bash
pnpm --filter @gamers-sg/database db:validate   # prisma validate
pnpm --filter @gamers-sg/database db:format     # prisma format
```

The database package exports a PrismaClient singleton from `@gamers-sg/database` (prevents multiple instances in dev via `globalThis`).

## Environment Variables

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

## Backend Architecture (NestJS)

### Module Structure

```
src/
├── app.module.ts              # Root module — imports all feature modules
├── main.ts                    # Bootstrap: cookieParser, CORS, globalPrefix "api"
├── config/configuration.ts    # Zod-based env validation
├── prisma/
│   ├── prisma.module.ts       # @Global() module, exports PrismaService
│   └── prisma.service.ts      # Extends PrismaClient, connects on init
├── common/
│   ├── decorators/
│   │   ├── public.decorator.ts         # @Public() — skips JWT guard
│   │   ├── roles.decorator.ts          # @Roles(Role.ADMIN) — RBAC metadata
│   │   ├── current-user.decorator.ts   # @CurrentUser() — extracts JWT payload
│   │   └── rate-limit.decorator.ts     # @RateLimit(config) — per-endpoint rate limiting
│   ├── guards/
│   │   ├── jwt-auth.guard.ts       # Global guard: checks JWT unless @Public()
│   │   ├── roles.guard.ts          # Global guard: checks @Roles() metadata
│   │   └── rate-limit.guard.ts     # Per-route guard, DB-backed rate limiting
│   └── filters/
│       └── http-exception.filter.ts # Global: wraps errors as { success, error }
└── modules/
    ├── auth/                  # Magic link request/verify/refresh/logout
    ├── users/                 # User profiles, search, discovery
    │   └── profiles/          # gamer-profile.service, organiser-profile.service
    ├── admin/                 # Admin panel (user mgmt, organiser review, audit log retrieval)
    ├── games/                 # Game library CRUD + players-by-game endpoint
    ├── tournaments/           # Tournaments + events (shared service, separate controllers)
    ├── connections/           # Bidirectional connections (send → accept → connected)
    ├── teams/                 # Team CRUD, roster, invites, disband
    └── audit/                 # Insert-only audit log
```

### Key Patterns

- **Global guards**: `JwtAuthGuard` and `RolesGuard` are `APP_GUARD`. Use `@Public()` to bypass JWT; use `@Roles()` to require specific roles. No `@Roles()` = any authenticated user can access.
- **Prisma is global**: `PrismaModule` is `@Global()` — all services inject `PrismaService` without importing the module.
- **Response format**: Errors go through `HttpExceptionFilter` → `{ success: false, error: { code, message, details? } }`. Success uses `{ success: true, data, meta? }`.
- **Service-level mappers**: Services use private `map*()` helper methods to convert Prisma snake_case results to camelCase DTOs. Controllers pass through mapped results directly.
- **Literal routes must precede `:id` param routes** in NestJS controllers. Express matches routes in order, so `/users/search` and `/users/discover/people-you-may-know` must be declared before `/users/:id`.

### Route Ordering Convention

When a controller has both literal routes and parameterized routes, literal routes ALWAYS come first:

```typescript
@Controller("users")
export class UsersController {
  @Get("me")                        // ← literal
  @Get("by-username/:username")     // ← literal (contains nested :param)
  @Get("search")                    // ← literal
  @Get("discover/people-you-may-know") // ← literal
  @Get(":id")                       // ← parameterized (LAST)
}
```

This applies to all controllers: `TeamsController`, `GamesController`, etc. Route ordering bugs manifest as 404s on literal endpoints.

## Database Schema

### Schema Change Workflow
1. Edit `packages/database/prisma/schema.prisma`
2. `pnpm db:generate` — regenerate Prisma Client
3. Update relevant DTOs in `packages/shared/src/dto/` if API surface changes
4. Update backend services/controllers that use changed fields
5. Update frontend forms/display

### Schema Conventions
- **UUID PKs**: All tables use `@default(uuid()) @db.Uuid`
- **Timestamps**: All use `@db.Timestamptz` (PostgreSQL `timestamptz`)
- **Snake case in DB**: `snake_case` columns → camelCase in TypeScript via Prisma
- **Composite unique constraints**: Used heavily — `@@unique([requester_id, addressee_id])` on Connection, `@@id([team_id, user_id])` on TeamMember, `@@unique([team_id, invitee_id])` on TeamInvite, `@@id([team_id, game_id])` on TeamGame
- **Historical preservation**: Team memberships use `left_at` (null = active) instead of deletion; teams use `DISBANDED` status instead of deletion
- **Cascade deletes**: User deletion cascades to profiles, tokens, registrations, connections, team memberships, team invites

### Key Models

**Connection** (Phase 2) — LinkedIn-style bidirectional:
- `requester_id` + `addressee_id` with `@@unique` constraint
- Status: `PENDING` → `ACCEPTED` or `REJECTED`
- Business rules: can't self-connect, duplicate detection, re-send allowed on REJECTED, either party can remove ACCEPTED connections, only addressee can accept/reject

**Team** (Phase 3):
- `tag` is unique (2-6 alphanum, uppercased on write)
- `status`: `ACTIVE` | `DISBANDED`
- `creator` → CAPTAIN membership auto-created on team creation
- Max 5 active team memberships per user, max 10 members per team
- `TournamentRegistration.team_id` links to Team with `onDelete: SetNull`

**TeamMember** — composite PK `[team_id, user_id]`, `left_at` preserves history

**TeamInvite** — composite unique `[team_id, invitee_id]`, status workflow: `PENDING` → `ACCEPTED`/`REJECTED`

**TeamGame** — composite PK `[team_id, game_id]`, many-to-many

## Shared Package (`@gamers-sg/shared`)

Exports via subpath patterns:

| Import path | Contents |
|---|---|
| `@gamers-sg/shared` | Everything (enums, types, DTOs, constants) |
| `@gamers-sg/shared/dto` | All DTOs across all domains |
| `@gamers-sg/shared/enums` | Re-exports Prisma enums from `@gamers-sg/database` |
| `@gamers-sg/shared/types` | `JwtPayload`, `ApiResponse<T>`, `PaginatedResponse<T>`, `PaginationQueryDto` |
| `@gamers-sg/shared/constants` | `AUTH` (token expiry, username cooldown), `RATE_LIMITS`, `PAGINATION` |

DTOs organized by domain file: `auth.dto.ts`, `user.dto.ts`, `admin.dto.ts`, `game.dto.ts`, `tournament.dto.ts`, `event.dto.ts`, `profile.dto.ts`, `connection.dto.ts`, `team.dto.ts`, `discovery.dto.ts`. All re-exported via `index.ts`.

## Role-Based Access Control

| Role | Access |
|---|---|
| `GAMER` | Dashboard, own profile, games, connections, teams, discover, tournament/event registration |
| `ORGANISER` | All GAMER access + organiser profile, tournament/event CRUD and management |
| `ADMIN` | All of the above + admin panel: user management, organiser review, tournament/event review, game library management, audit log viewer |

## Authentication

### Flow: Magic Link → JWT + Refresh Token
1. `POST /api/auth/magic-link/request` — upserts user, generates token, sends email via Resend
2. Previous unused tokens for that user are invalidated (single active link)
3. `POST /api/auth/magic-link/verify` — validates token, returns JWT access token (15-min) + user profile
4. Sets two `httpOnly`, `sameSite: "lax"` cookies:
   - `refresh_token` (30-day, path `/api/auth`)
   - `access_token` (15-min, path `/`)
5. `POST /api/auth/refresh` — reads `refresh_token` cookie, validates, revokes old, issues new pair (rotation)
6. `POST /api/auth/logout` — revokes refresh token, clears cookie

### Token Storage & Security
- Refresh tokens stored as SHA-256 hash in DB (individual revocation)
- Access token stored in memory only (not localStorage): `apiClient` sets via `setAccessToken()` and attaches via `Authorization: Bearer` header
- `access_token` cookie is used by Next.js middleware for client-side route gating only (decode, no cryptographic verify)

## Frontend Architecture (Next.js 15 App Router)

### Next.js 15 Params Pattern
Dynamic route params are now `Promise<T>` — must be unwrapped with `use()`:

```typescript
import { use } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // ...
}
```

### Two API Client Instances

- **`apiClient`** (default from `@/lib/api-client`): Attaches `Bearer` token via request interceptor, auto-refreshes on 401 with request queuing, `withCredentials: true`. Used for all authenticated pages.
- **`apiPublic`** (named export): No auth header, no interceptors, no cookies. Used for public browse pages (`/tournaments`, `/events`) where the user may not be logged in. Also used conditionally in connection-aware components (see below).

### Connection-Aware Fetching Pattern
Components that display profile data conditionally use `apiClient` when authenticated (to send cookies so the backend can compute `connectionStatus`, `mutualConnectionsCount`) or `apiPublic` when the viewer is anonymous:

```typescript
const client = isAuthenticated ? apiClient : apiPublic;
const { data } = await client.get(`/users/by-username/${username}`);
```

### Auth Client Architecture

```
AuthProvider (React Context)
  ├── On mount: POST /auth/refresh (sends cookies via withCredentials)
  └── Provides: user (UserProfileDto), isLoading, isAuthenticated, logout

apiClient (Axios)
  ├── Request interceptor: attaches Authorization: Bearer <accessToken>
  └── Response interceptor on 401:
      ├── Queues concurrent requests during refresh
      ├── Calls /auth/refresh (with cookie)
      ├── Retries queued requests with new token
      └── On refresh 401: clears token, redirects to /login
      └── On refresh network error: rejects without logout (callers can retry)
```

### Route Groups

```
src/app/
├── layout.tsx                      # Root: AuthProvider + Toaster, dark theme
├── page.tsx                        # Landing page
├── (auth)/                         # Public auth routes
│   ├── login/page.tsx              # Email → magic link
│   └── verify/page.tsx             # Token verification from link
├── tournaments/                    # Public tournament listings + detail
├── events/                         # Public event listings + detail
├── u/[username]/page.tsx           # Public gamer profile showcase (Phase 1)
└── (dashboard)/                    # Protected routes (middleware redirects to /login)
    ├── layout.tsx                  # Auth guard + DashboardLayout
    ├── dashboard/page.tsx          # Welcome card + completeness + people you may know widget
    ├── profile/page.tsx            # User profile
    ├── profile/edit/page.tsx       # Edit gamer profile (Phase 1)
    ├── connections/page.tsx        # Manage connections (Phase 2)
    ├── teams/                      # Teams (Phase 3)
    │   ├── page.tsx                # My teams (current/past/invites tabs)
    │   ├── create/page.tsx         # Create team form
    │   ├── [id]/page.tsx           # Team detail (roster, games, invite, disband)
    │   └── [id]/edit/page.tsx      # Edit team info
    ├── discover/page.tsx           # Discovery: Search, People You May Know, By Game (Phase 4)
    ├── settings/page.tsx
    ├── become-organiser/page.tsx
    ├── organiser/                  # Organiser-only routes
    │   ├── page.tsx, tournaments/**, events/**
    └── admin/                      # Admin-only routes
        ├── page.tsx, users/, organisers/, games/, tournaments/, events/, audit-logs/
```

### Next.js Middleware (Route Protection)

`middleware.ts` at the frontend root protects dashboard/admin/organiser/profile/settings routes. If no `access_token` cookie → redirect to `/login?redirect=<path>`. Admin routes additionally decode the JWT (via `jose`, decode-only) to check `role === "ADMIN"`.

**Caveat**: Middleware JWT decoding is NOT cryptographic verification. A forged cookie with a fake role would render empty page shells without data — the backend enforces actual auth on every API call.

### Key Components

| Component | Purpose |
|---|---|
| `DashboardLayout` | Responsive sidebar + header layout |
| `Sidebar` | Nav with active state highlighting, role-conditional sections (Organiser/Admin), pending-connections badge |
| `Header` | Sticky top bar with user menu dropdown |
| `WelcomeCard` | Dashboard greeting card |
| `PublicProfile` | Reusable public profile display (banner, avatar, bio, games, tournament/event history, teams, connections count) |
| `CompletenessIndicator` | Profile completeness progress bar (Beginner/Intermediate/All-Star) |
| `ConnectButton` | 5-state button: Connect, Request Sent (amber→red Cancel on hover), Accept+Decline, Connected (green→red Remove on hover) |
| `ConnectionCard` | Card for connections list (avatar, name, pending badge) |
| `TeamCard` | Card for team list (logo, tag, member count, role badge) |
| `InviteDialog` | Modal for searching users by username and sending team invites |
| `UserSearchCard` | Discovery card with avatar, games, connect button |
| `PeopleYouMayKnowWidget` | Reusable widget (compact for dashboard, full for discover page) |
| `GameSelector` | Reusable game picker component |

### UI Stack

- **Tailwind CSS v4** (not v3 — uses `@tailwindcss/postcss` plugin, CSS-based config)
- **Radix UI** primitives: Dialog, DropdownMenu, Slot, Avatar, Label, Select
- **No shadcn/ui** — Radix primitives used directly with custom styling
- **Lucide React** for icons
- **Sonner** for toast notifications
- **react-hook-form** + **zod** for form validation (tournament/event forms)
- **class-variance-authority** + **tailwind-merge** + **clsx** via `cn()` utility
- **jose** for JWT decoding in Next.js middleware (decode only)

### Tailwind Theme Tokens

Dark theme exclusively. Common tokens:
- Backgrounds: `bg-surface-950` (deepest), `bg-surface-900` (cards), `bg-surface-800` (inputs/elements), `bg-surface-700` (borders/hover)
- Brand: `bg-brand-500`, `text-brand-400`, `border-brand-500/20`
- Text: `text-slate-100` (headings), `text-slate-200` (body), `text-slate-400` (secondary), `text-slate-500` (muted)
- Status: `bg-green-500/10 text-green-400 border-green-500/20` (success), `bg-red-500/10 text-red-400 border-red-500/20` (danger), `bg-amber-500/10 text-amber-400 border-amber-500/20` (warning)

## Connections Module (Phase 2)

LinkedIn-style bidirectional connections. Both parties must consent — one sends, the other accepts.

**Backend**: `apps/backend/src/modules/connections/` — single `ConnectionsService`, two controllers (`ConnectionsController` at `/connections`, `UserConnectionsController` at `/users` for public count lookup).

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /connections` | GAMER | Send request (body: `{addresseeId}`) |
| `PUT /connections/:id/accept` | GAMER | Accept incoming request |
| `PUT /connections/:id/reject` | GAMER | Reject incoming request |
| `DELETE /connections/:id` | GAMER | Cancel outgoing / remove connection |
| `GET /connections` | GAMER | List connections (filter by status, paginated) |
| `GET /connections/pending-count` | GAMER | Incoming pending count (sidebar badge) |
| `GET /users/:userId/connections/count` | Public | Connection count (profile display) |

**Business rules**: Can't self-connect, duplicate detection, REJECTED allows re-send, only addressee can accept/reject, either party can remove ACCEPTED connections.

**Frontend**: `/connections` page with 3 sub-tabs (Connected/Requests/Sent). `ConnectButton` component has 5 states: none → Connect, pending_sent → Request Sent (hover→Cancel), pending_received → Accept+Decline, accepted → Connected (hover→Remove). Sidebar shows pending count badge.

## Teams Module (Phase 3)

Full team lifecycle: create, invite, roster management, disband.

**Backend**: `apps/backend/src/modules/teams/` — `TeamsService` (~500 lines) + `TeamsController` (12 endpoints).

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /teams` | GAMER | Create team (creator → CAPTAIN, auto-joins) |
| `GET /teams/my/teams` | GAMER | Current + past teams split by `left_at` |
| `GET /teams/my/invites` | GAMER | Pending team invites |
| `GET /teams` | Public | List/search teams (recruiting, game, pagination filters) |
| `GET /teams/:id` | Public | Team profile with active roster |
| `PUT /teams/:id` | CAPTAIN | Update team info |
| `DELETE /teams/:id` | CAPTAIN | Disband (preserves history via `left_at` + `DISBANDED` status) |
| `POST /teams/:id/invites` | CAPTAIN/MEMBER | Invite user |
| `PUT /teams/:id/invites/:inviteId/accept` | invitee | Accept invite (re-activates or creates membership) |
| `PUT /teams/:id/invites/:inviteId/reject` | invitee | Reject invite |
| `DELETE /teams/:id/members/:userId` | CAPTAIN or self | Remove member / leave team |
| `PUT /teams/:id/members/:userId/role` | CAPTAIN | Promote/demote member |

**Captain safeguards**: Cannot demote/remove the last captain — must promote another first or disband. Disbanding sets all members' `left_at` to now and changes status to `DISBANDED`.

**Frontend**: `/teams` (3-tab: My Teams / Invites / Past), `/teams/create` (name, tag, description, game picker, recruiting toggle), `/teams/[id]` (team profile with banner, roster, captain actions: promote/demote/remove, invite dialog, disband danger zone), `/teams/[id]/edit`. `TeamCard` for lists. `InviteDialog` modal for username search + invite. Public profile shows current + past teams in sidebar.

## Discovery & Network (Phase 4)

**Backend**: Discovery endpoints live in `UsersController` and `GamesController` (both use `UsersService` logic).

**"People You May Know" algorithm** (request-time, no ML):
1. Shared games → weight 3 each
2. Mutual connections → weight 5 each
3. Score descending → top 20 with `reason` field
4. Excludes: self, existing connections (any status), suspended users, private profiles

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /users/search?query=` | Public (optional auth) | Search by username/displayName |
| `GET /users/discover/people-you-may-know` | GAMER | Suggested connections |
| `GET /games/:slug/players` | Public (optional auth) | Find players by game |

**Frontend**: `/discover` (3-tab: Search / People You May Know / By Game). Dashboard shows compact "People You May Know" widget (top 5). Sidebar has "Discover" nav item.

## Profile Completeness (Phase 1)

Server-computed score shown as progress bar on dashboard + own profile:
- Avatar set: 20pts, DisplayName set: 15pts, Bio set: 15pts, ≥1 game: 20pts, Banner set: 10pts, ≥3 games: 10pts, ≥1 connection: 10pts
- Labels: Beginner (0-39), Intermediate (40-69), All-Star (70-100)

## Key Architectural Decisions

- **No soft-deletes for teams**: Historical preservation uses `left_at` (nullable timestamp) on TeamMember + `DISBANDED` team status. Never hard-delete team data.
- **Symmetrical connections**: Once ACCEPTED, both parties are equally connected — either can remove. The `requester`/`addressee` distinction only matters during PENDING state.
- **Connection-aware profile queries**: Backend profile endpoints accept an optional `viewerId` — the backend computes whether the viewer has a connection/pending request with the profile owner, plus mutual connection counts. This avoids N+1 client-side queries.
- **Team game selection is additive**: Games are pre-selected at creation (optional `gameIds` array) but can't be edited afterward via the API (not yet implemented — stored for future).
- **Discovery is request-time, not pre-computed**: "People You May Know" recomputes every request. No caching, no ML — simple scoring across 200 candidates max.

## Out of Scope

- Native mobile apps, messaging/chat, social feed
- Live bracket management, matchmaking
- Multi-language support
- Tests (infrastructure not yet set up)
- Achievements module, notifications, Stripe integration
