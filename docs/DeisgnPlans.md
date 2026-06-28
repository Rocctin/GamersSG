Here's a comprehensive implementation plan covering all 10 items, based on the codebase patterns and the V1.0 spec:

---

# Gamers.SG — Full V1.0 Implementation Plan

## 1. Games Library ✅

**Purpose**: Foundational reference data — a platform-managed catalogue of games that profiles, teams, tournaments, and jobs all reference.

### Database
- Add `Game` model to `schema.prisma`: fields for `name`, `slug` (unique), `cover_image_url`, `genre`, `platforms` (JSON array), `is_active`
- Add `UserGame` join model: `user_id` → `User`, `game_id` → `Game`, `in_game_role` (optional string), `skill_level` (optional enum)

### Backend
- New module: `GamesModule` (`games.module.ts`, `games.controller.ts`, `games.service.ts`)
- `GET /api/games` — list/search games (public)
- `POST /api/games` — create game (admin only)
- `PUT /api/games/:id` — update game (admin only)
- `POST /api/users/me/games` — add game to profile (gamer)
- `DELETE /api/users/me/games/:gameId` — remove game from profile (gamer)

### Frontend
- Admin: game management CRUD page under `/admin/games`
- Profile: `Add Games` section — searchable multi-select from the game library with optional role input per game

### Shared
- `GameDto`, `CreateGameDto`, `UpdateGameDto` in `packages/shared/src/dto/`

---

## 2. Teams Module

**Purpose**: Competitive team formation, roster management, and historical membership tracking.

### Database
- `Team` model: `name` (unique), `tag` (unique), `logo_url`, `bio`, `visibility`, `captain_id` → `User`
- `TeamMember` model: `team_id`, `user_id`, `in_game_role`, `joined_at`, `left_at` (nullable for historical record)
- `TeamInvite` model: `team_id`, `inviter_id`, `invitee_id`, `status` (PENDING/ACCEPTED/DECLINED/EXPIRED), `token` (for shareable link)
- `TeamGame` join: `team_id` → `Team`, `game_id` → `Game`

### Backend
- `TeamsModule`: `teams.module.ts`, `teams.controller.ts`, `teams.service.ts`
- `POST /api/teams` — create team (any verified gamer, creator becomes captain)
- `GET /api/teams` — list/search teams
- `GET /api/teams/:id` — team profile
- `PUT /api/teams/:id` — update team (captain only)
- `DELETE /api/teams/:id` — disband team (captain only, preserves historical record)
- `POST /api/teams/:id/invite` — invite member (captain only, by username or generate link)
- `POST /api/teams/invite/:token` — accept invite via link
- `POST /api/teams/:id/members/:userId` — respond to invite (accept/decline)
- `DELETE /api/teams/:id/members/:userId` — remove member (captain only)
- `POST /api/teams/:id/leave` — leave team (member)
- `PUT /api/teams/:id/captain` — transfer captain (captain only)

### Frontend
- `/teams` — team directory page (public, search/filter by game)
- `/teams/[slug]` — team profile page (public)
- `/dashboard/teams` — "My Teams" page showing current and past memberships
- Team invite acceptance page at `/teams/join/[token]`

### Shared
- `TeamDto`, `CreateTeamDto`, `UpdateTeamDto`, `TeamMemberDto`, `TeamInviteDto`

---

## 3. Achievements System

**Purpose**: Verified competitive records — the core value unit on a gamer's profile. Admin/organiser-assigned only.

### Database
- `AchievementTemplate` model: `title`, `description`, `category` (enum: TOURNAMENT_PLACEMENT, EVENT_PARTICIPATION, COMMUNITY_CONTRIBUTION, PLATFORM_ACTIVITY, SPECIAL_AWARD), `game_id` → `Game`, `event_id` (nullable), `points_value`, `badge_image_url`, `visibility`, `created_by` → `User`
- `AchievementAssignment` model: `template_id` → `AchievementTemplate`, `user_id` → `User`, `awarded_by` → `User`, `awarded_at`, `metadata` (JSON — placement, notes)

### Backend
- `AchievementsModule`: `achievements.module.ts`, `achievements.controller.ts`, `achievements.service.ts`
- `POST /api/admin/achievements` — create template (admin)
- `PUT /api/admin/achievements/:id` — edit template (admin)
- `DELETE /api/admin/achievements/:id` — delete template (admin)
- `GET /api/achievements` — list templates (public, filtered by game/category)
- `POST /api/admin/achievements/assign` — bulk assign via CSV upload or user ID list (admin)
- `POST /api/organisers/achievements/assign` — organiser assigns to event participants (organiser)
- `GET /api/users/:id/achievements` — user's achievements (public)
- Auto-credit points on assignment (call points service)

### Frontend
- Admin: achievement template CRUD at `/admin/achievements`
- Admin/Organiser: assignment interface with CSV upload and individual assignment
- Profile: "Achievements" section displaying earned achievements with badges, categories, dates

### Shared
- `AchievementTemplateDto`, `AchievementAssignmentDto`, `CreateAchievementDto`, `BulkAssignDto`

---

## 4. Tournaments & Events ✅

**Purpose**: Organiser-listed competitive and community activities with registration, payment, and achievement integration. This is the largest module.

### Database
- `Tournament` model: all fields from spec §7.2 (name, description, game_id, format enum, platform, registration start/end, tournament start/end, is_online, venue, is_team_based, max_participants, prize_pool, registration_fee, ruleset_url, organiser_id, status enum: DRAFT/PENDING_REVIEW/APPROVED/REJECTED/ONGOING/COMPLETED/CANCELLED)
- `Event` model: all fields from spec §7.2 (name, description, event_type enum: PHYSICAL/DIGITAL/HYBRID, access_type, capacity, registration start/end, event_date, venue, age_restrictions, registration_fee, points_awarded, organiser_id, status)
- `TournamentRegistration` / `EventRegistration` models: user_id, tournament_id/event_id, team_id (nullable, for team tournaments), status, registered_at, checked_in_at
- `TournamentPlacement` model: tournament_id, user_id/team_id, placement, points_awarded

### Backend
- `TournamentsModule` + `EventsModule` (or unified `ActivitiesModule`)
- Organiser CRUD endpoints (create, update, cancel)
- Admin moderation endpoints (approve/reject listings)
- Public browse/search endpoints with game/platform/date filters
- Registration endpoints (individual + team)
- Check-in endpoints (for points awarding)
- Completion → achievement auto-assignment trigger

### Frontend
- `/tournaments` — browse directory with filters
- `/tournaments/[id]` — detail page with registration CTA
- `/events` — browse directory with type filters
- `/events/[id]` — detail page
- Organiser portal at `/dashboard/organiser/tournaments` and `/dashboard/organiser/events`
- Admin moderation at `/admin/tournaments` and `/admin/events`

---

## 5. Membership & Payments

**Purpose**: Annual subscription monetisation — the core revenue model.

### Database
- `MembershipPlan` model: `name`, `price_sgd`, `duration_months`, `is_active`, `features` (JSON)
- `Subscription` model: `user_id`, `plan_id`, `status` (ACTIVE/CANCELLED/EXPIRED), `started_at`, `expires_at`, `stripe_subscription_id`
- `Payment` model: `user_id`, `amount_sgd`, `currency`, `status`, `stripe_payment_intent_id`, `payment_type` (SUBSCRIPTION/TOURNAMENT/STORE), `reference_id` (polymorphic), `metadata` (JSON)

### Backend
- `MembershipModule` + Stripe integration
- `GET /api/membership/plans` — list available plans (public)
- `POST /api/membership/subscribe` — create Stripe checkout session
- `POST /api/webhooks/stripe` — Stripe webhook handler (provision subscription on payment success)
- `GET /api/users/me/subscription` — current subscription status
- `POST /api/users/me/subscription/cancel` — cancel auto-renewal
- Renewal reminder cron job (30, 7, 1 day before expiry)

### Frontend
- `/membership` — plans comparison page with "Subscribe" CTA
- Stripe Checkout redirect flow
- Dashboard: membership status widget with renewal date
- Admin: plan management at `/admin/membership`

---

## 6. Points System

**Purpose**: Internal rewards currency — earn via activities, redeem in store.

### Database
- `PointsTransaction` model: `user_id`, `amount` (positive=earned, negative=spent), `type` (enum: REGISTRATION_BONUS, PROFILE_COMPLETE, TOURNAMENT_PARTICIPATION, TOURNAMENT_PLACEMENT, EVENT_ATTENDANCE, SURVEY, RENEWAL_LOYALTY, REFERRAL, ACHIEVEMENT, STORE_REDEMPTION, ADMIN_ADJUSTMENT), `reference_id` (polymorphic), `reference_type`, `expires_at`, `metadata` (JSON)
- Add `points_balance` to `GamerProfile` (already exists — denormalized for fast reads)

### Backend
- `PointsModule` as a shared service (injected by other modules)
- `POST /api/admin/points/award` — manual award (admin, with audit log)
- `POST /api/admin/points/deduct` — manual deduction (admin, with audit log)
- `GET /api/users/me/points/transactions` — transaction history (paginated)
- Cron job: expire points older than 24 months
- Integration points: called by achievements, tournaments, events, membership, store services

### Frontend
- Dashboard: points balance display (already exists in welcome card, wire to real data)
- `/dashboard/points` — transaction history page
- Admin: points management UI at `/admin/points`

---

## 7. Jobs Board

**Purpose**: Gaming-industry job listings connecting employers with the verified gamer community.

### Database
- `JobListing` model: `title`, `organisation_name`, `job_type` (enum), `location`, `description` (rich text), `requirements` (rich text), `compensation`, `application_deadline`, `application_method` (PLATFORM/EXTERNAL), `external_url`, `status` (DRAFT/PENDING_REVIEW/APPROVED/REJECTED/CLOSED), `posted_by` → `User`
- `JobApplication` model: `job_id`, `user_id`, `cover_note`, `resume_url`, `status`, `submitted_at`
- `JobTag` join: `job_id`, `tag` (string — game names, skills, roles)

### Backend
- `JobsModule`: `jobs.module.ts`, `jobs.controller.ts`, `jobs.service.ts`
- `POST /api/jobs` — create listing (organiser/employer)
- `GET /api/jobs` — browse/search listings (public, with filters)
- `GET /api/jobs/:id` — listing detail
- `POST /api/jobs/:id/apply` — submit application (member only, includes profile link)
- `GET /api/jobs/:id/applications` — view applications (listing owner + admin)
- Admin moderation endpoints (approve/reject)

### Frontend
- `/jobs` — browse directory with type/tag filters
- `/jobs/[id]` — detail page with "Apply" CTA (includes cover note + CV upload)
- `/dashboard/applications` — user's application history
- Organiser: application management at `/dashboard/organiser/jobs`
- Admin moderation at `/admin/jobs`

---

## 8. Member Store

**Purpose**: Members-only e-commerce with points offset. This is the most complex module after tournaments.

### Database
- `ProductCategory` model: `name`, `slug`, `description`
- `Product` model: all fields from spec §10.3 (name, category_id, description, images (JSON array), regular_price_sgd, member_price_sgd, points_offset_eligible, stock_quantity, fulfilment_type enum, partner_supplier, is_active)
- `Cart` / `CartItem` models: user_id, product_id, quantity
- `Order` model: `user_id`, `status` (PENDING_PAYMENT/PAID/PROCESSING/SHIPPED/DELIVERED/CANCELLED), `subtotal_sgd`, `points_applied`, `total_sgd`, `stripe_payment_intent_id`, `fulfilment_status`
- `OrderItem` model: `order_id`, `product_id`, `quantity`, `unit_price_sgd`
- `DigitalCode` model: `product_id`, `code`, `order_item_id` (nullable — assigned on purchase)

### Backend
- `StoreModule`: products, cart, checkout, orders
- `GET /api/store/products` — browse products (members only)
- `GET /api/store/products/:id` — product detail
- Cart CRUD endpoints
- `POST /api/store/checkout` — create Stripe PaymentIntent with points offset calculation
- Order confirmation → digital code delivery via email
- Admin: product CRUD at `POST/PUT/DELETE /api/admin/store/products`
- Admin: order management (list, update fulfilment status)

### Frontend
- `/store` — product catalogue with category filters
- `/store/[id]` — product detail with "Add to Cart"
- Cart slideover/drawer with points offset toggle
- Checkout flow → Stripe Elements
- `/dashboard/orders` — order history
- Admin: store management at `/admin/store`

---

## 9. Notifications System

**Purpose**: Cross-cutting — in-platform bell + email for all spec-defined triggers. Built incrementally alongside other modules.

### Database
- `Notification` model: `user_id`, `type` (enum covering all spec triggers), `title`, `body`, `link` (optional deeplink), `is_read`, `channel` (IN_PLATFORM/EMAIL/BOTH), `metadata` (JSON), `created_at`
- `NotificationPreference` model: `user_id`, `notification_type`, `in_platform` (bool), `email` (bool)

### Backend
- `NotificationsModule` as a shared service
- `NotificationService.send()` — generic method called by other modules
- `GET /api/notifications` — paginated notification feed
- `POST /api/notifications/:id/read` — mark as read
- `POST /api/notifications/read-all` — mark all read
- `GET /api/notifications/unread-count` — badge count
- `GET/PUT /api/users/me/notification-preferences` — preferences CRUD
- Email integration for transactional notifications (Resend templates)

### Frontend
- `NotificationBell` component in `Header` — icon with unread badge, dropdown feed
- `/dashboard/notifications` — full notification history page
- Settings: notification preference toggles (replace current stub at `/settings`)

---

## 10. Admin Panel Expansion

**Purpose**: Grows with each module — full back-office management per spec §11.2.

### Per-Module Admin Pages
| Module | Admin Pages to Add |
|--------|-------------------|
| Games | `/admin/games` — CRUD table |
| Teams | `/admin/teams` — list, search, disband |
| Achievements | `/admin/achievements` — template CRUD, bulk assign |
| Tournaments | `/admin/tournaments` — moderation queue, all listings |
| Events | `/admin/events` — moderation queue, all listings |
| Jobs | `/admin/jobs` — moderation queue, all listings |
| Store | `/admin/store/products`, `/admin/store/orders` |
| Points | `/admin/points` — manual award/deduct, transaction log |
| Membership | `/admin/membership` — plans, active/lapsed view, manual overrides |
| Content | `/admin/content` — static pages (FAQs, announcements) |
| Reports | `/admin/reports` — CSV exports (users, transactions, memberships, registrations) |

### Backend
- Expand `AdminController` / `AdminService` or create sub-controllers per module
- CSV export endpoints using a streaming response pattern
- Content page CRUD (`Page` model: slug, title, body, is_published)

---

## Cross-Cutting Concerns

| Concern | Approach |
|---------|----------|
| **Audit logging** | Use existing `AuditService.log()` pattern — add new `AuditAction` enum values per module |
| **RBAC** | Use existing `@Roles()` decorator + `@Public()` for public browse endpoints |
| **Rate limiting** | Use existing `@RateLimit()` decorator on sensitive endpoints (registration, checkout, apply) |
| **Error handling** | Use existing `HttpExceptionFilter` pattern — `{ success, error }` format |
| **Pagination** | Use existing `PAGINATION` constants + `{ data, meta: { total, page, pageSize, totalPages } }` pattern |
| **DTOs** | Add to `packages/shared/src/dto/` following existing conventions (camelCase interfaces) |
| **File uploads** | Add S3/Cloudflare R2 integration — needed for profile photos, team logos, product images, achievement badges, resume uploads, ruleset PDFs |
| **Email templates** | Add Resend templates for all transactional triggers beyond magic link (order confirmations, notifications, renewal reminders) |

---

## Implementation Order Rationale

```
Games Library (1)
    ↓
Teams (2) ─────────────┐
    ↓                  │
Achievements (3)       │
    ↓                  │
Tournaments & Events (4) ← depends on 1,2,3
    ↓
Membership & Payments (5) ← Stripe integration
    ↓
Points (6) ← depends on 3,4,5 for earning triggers
    ↓
Jobs (7) ← profile integration, membership-gated
    ↓
Store (8) ← depends on 5,6 for payments + points
    ↓
Notifications (9) ← built incrementally across all modules
    ↓
Admin Panel (10) ← grows alongside all modules
```

Each module can be scoped as a discrete work package with its own schema migration, backend module, frontend routes, and shared DTOs. Dependencies between modules (e.g., achievements depending on games, tournaments depending on teams) should be handled by importing the dependent module's service.