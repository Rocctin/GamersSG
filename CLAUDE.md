# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gamers.SG** is a national digital membership platform for gamers in Singapore, developed under the stewardship of SCOGA (Singapore Cybersports and Online Gaming Association). Think of it as "LinkedIn for gamers" — a verified identity and services hub combining competitive gaming profiles, achievements, team management, tournaments, a jobs board, and members-only e-commerce.

**Current Phase**: Phase 1 — Authentication(Use simple login as placeholder), RBAC, and database foundation.
- Implement Backend framework with NestJS, Prisma & PostgresSQL
- Implement Frontend Framework with Next.js (App Router) + Tailwind + shadcn/ui
- In the same repository TypeScript monorepo (Turborepo) with shared types/DTOs

**Key Strategic Pillars**:
- **Monetization**: Annual membership subscription model
- **Data Authenticity**: SingPass/Myinfo integration for verified, one-person-one-account identity
- **Ecosystem Value**: Interconnected features creating compounding value for gamers, organisers, and partners

## Database Commands

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name descriptive_migration_name

# Apply migrations to production
npx prisma migrate deploy

# Open Prisma Studio to view/edit data
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Validate schema without generating
npx prisma validate

# Format schema file
npx prisma format
```

## Architecture and Data Model

### Database: PostgreSQL + Prisma ORM

The schema is organized into these core areas:

#### 1. **User Identity & Roles** (Phase 1)
- `User` — Core identity table with three roles: `GAMER`, `ORGANISER`, `ADMIN`
- `AccountStatus` — Lifecycle states: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`
- **SingPass Integration**: `nric_hash` and `legal_name` fields are nullable now, will be populated when SingPass/Myinfo is integrated
- NRIC must NEVER be stored in plaintext — use bcrypt or SHA-256 one-way hash

#### 2. **Extended Profiles** (Phase 1)
- `GamerProfile` — Public gaming identity with username, bio, avatar, membership status, and points balance
  - Username change throttle: Maximum once per 90 days
  - Visibility levels: `PUBLIC`, `MEMBERS_ONLY`, `PRIVATE`
  - `points_balance` stored here for fast dashboard reads
- `OrganiserProfile` — Organisation details for event/tournament listings
  - Includes admin review workflow: `reviewed_by`, `reviewed_at`, `rejection_reason`

#### 3. **Authentication** (Phase 1 - Magic Links, SingPass Later)
- `AuthToken` — One-time magic-link tokens (30-minute expiry) via Resend
  - Stores SHA-256 hash of the token, never plaintext
  - **Note**: SingPass will bypass this table entirely when integrated
- `RefreshToken` — Long-lived session renewal tokens
  - Stored in DB for individual revocation (e.g., on account suspension)
  - Device fingerprint tracking via `request_ip` and `user_agent`

#### 4. **Audit & Compliance** (Phase 1)
- `AuditLog` — Immutable, insert-only record of all admin actions
  - Never update or delete rows
  - Tracks actor (admin), target (user/entity), action type, metadata
  - Used for PDPA compliance and admin accountability

#### 5. **Rate Limiting** (Phase 1)
- `RateLimitBucket` — DB-backed rate limiting for auth endpoints
  - Replace with Redis in production at scale

#### 6. **Future Phases** (Not Yet Implemented)
- Teams, Tournaments, Events (Phase 2)
- Achievements System (Phase 3)
- Points earning/spending, Member Store (Phase 4)
- Jobs Board (Phase 5)

### Key Design Principles

1. **One Person, One Account**: Enforced via `nric_hash` uniqueness constraint when SingPass is integrated
2. **Immutable Audit Trail**: Never delete audit logs or achievement records
3. **Cascade Deletes**: User deletion cascades to profiles, tokens, etc. (defined in schema)
4. **Timestamptz Everywhere**: All timestamps use PostgreSQL `timestamptz` for timezone awareness
5. **UUID Primary Keys**: All tables use UUIDs, not auto-incrementing integers

## Authentication Flow (Current Phase 1 Implementation)

### Magic Link Authentication
1. User enters email
2. System generates a one-time token, hashes it with SHA-256
3. `AuthToken` record created with `token_hash`, `expires_at` (30 mins), `request_ip`, `user_agent`
4. Email sent via Resend with magic link containing raw token
5. User clicks link, token is validated:
   - Check token hasn't been used (`used_at` is null)
   - Check token hasn't expired
   - Mark `used_at` on successful use
6. JWT session created, `RefreshToken` issued

### Future: SingPass Integration
- Primary authentication method for all Gamer accounts
- OAuth 2.0 / OpenID Connect flow via [api.singpass.gov.sg](https://api.singpass.gov.sg)
- Myinfo API provides pre-verified data: name, NRIC (hashed), DOB, nationality
- Organiser accounts remain email/password-based (no SingPass requirement)
- Platform must be registered as a Relying Party (RP) under NDI framework (4-8 week approval process)

## Role-Based Access Control (RBAC)

Three distinct roles with different journeys:

### `GAMER` (Primary User)
- Verified Singapore resident
- Holds a profile, collects achievements, joins teams
- Participates in events/tournaments
- Applies for jobs, shops at member store
- **Revenue**: Annual subscription

### `ORGANISER`
- Entity (company, school, association, individual)
- Lists tournaments and events
- Manages registrations, awards achievements
- **Revenue**: Listing fees or revenue-share (TBD)

### `ADMIN` (SCOGA Staff)
- Full back-office access
- Platform moderation, achievement management
- User verification oversight, store management
- No public-facing access

## Security Requirements

1. **HTTPS Only**: All sessions over HTTPS
2. **JWT + Refresh Token Rotation**: Configurable expiry, rotation for long-lived sessions
3. **No Plaintext Secrets**: NRIC hashed, auth tokens hashed, passwords hashed
4. **PDPA Compliance**: Minimal data collection, secure storage, audit trail
5. **PCI-DSS**: Payment processing via third-party gateway (never store card data)
6. **Session Revocation**: Admin can revoke all refresh tokens for a suspended user

## Integration Points (Future)

### SingPass/Myinfo
- Developer Portal: [https://api.singpass.gov.sg](https://api.singpass.gov.sg)
- Myinfo Guide: [https://docs.developer.tech.gov.sg/docs/myinfo-gov/](https://docs.developer.tech.gov.sg/docs/myinfo-gov/)

### Payment Gateway (Recommended)
- Stripe (SGD supported)
- HitPay (Singapore-native, PayNow support)
- Braintree

### Email Service
- Resend (current), SendGrid, Postmark, or AWS SES
- Use verified sending domain: `@gamers.sg`

### File Storage
- AWS S3, Google Cloud Storage, or Cloudflare R2
- CDN delivery for user-uploaded assets (avatars, banners, product images)

## Development Workflow Patterns

### Adding a New User Field
1. Update `schema.prisma`
2. Run `npx prisma migrate dev --name add_user_field_name`
3. Update TypeScript types (if using Prisma Client types)
4. Add field to relevant API endpoints
5. Update frontend forms/display

### Adding a New Audit Action
1. Add enum value to `AuditAction` in schema
2. Run migration
3. Create audit log entry when action occurs:
   ```typescript
   await prisma.auditLog.create({
     data: {
       actor_id: adminUser.id,
       target_id: targetUser.id,
       action: 'NEW_ACTION',
       target_type: 'user',
       metadata: { reason: '...', old_value: '...', new_value: '...' },
       ip_address: req.ip,
     },
   });
   ```

### Suspending a User Account
1. Update `User.status` to `SUSPENDED`
2. Revoke all `RefreshToken` records (set `revoked_at`)
3. Create `AuditLog` entry with `USER_SUSPENDED` action
4. Never delete the user record

### Username Change Validation
1. Check `GamerProfile.username_changed_at`
2. Enforce 90-day throttle: `username_changed_at + 90 days > now()`
3. Check uniqueness constraint
4. Update `username` and `username_changed_at`

## Out of Scope for V1.0

- Native iOS/Android apps (responsive web only)
- In-platform messaging/chat
- Social feed or content publishing
- Live bracket management
- Matchmaking or team-finding algorithms
- Integrated streaming/VOD
- Multi-language support (English only)

## Non-Functional Requirements

- **Performance**: Page load < 3s, API p95 < 500ms, 10,000+ concurrent users
- **Availability**: 99.5% uptime target
- **Scalability**: Horizontal scaling, designed for 100,000+ users within 3 years
- **Browser Support**: Latest 2 major versions of Chrome, Firefox, Safari, Edge
- **Mobile**: Fully responsive, mobile-first design (no native app yet)

## Critical Decisions Pending

As of Phase 1, the following require decisions from SCOGA:
- Annual membership pricing (monthly option?)
- Organiser listing fees (if any)
- Jobs board listing fees (if any)
- Points expiry policy (currently 24-month expiry TBD)
- Minimum cash payment in store (can points offset 100%?)
- Physical goods fulfilment logistics (in-house or partner-managed?)
- SingPass Relying Party application status (4-8 week approval lead time)
