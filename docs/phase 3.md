## Phase 3: Teams Module

### Database Schema (Prisma migration)
- **New enums**: `TeamMemberRole` (CAPTAIN, MEMBER), `TeamStatus` (ACTIVE, DISBANDED), `TeamInviteStatus` (PENDING, ACCEPTED, REJECTED, EXPIRED)
- **New models**:
  - `Team` — `id`, `name`, `tag` (unique), `description`, `logo_url`, `banner_url`, `is_recruiting`, `status`, `created_by` → User
  - `TeamMember` — `team_id` → Team, `user_id` → User, `role`, `joined_at`, `left_at` (null = active). `@@unique([team_id, user_id])`
  - `TeamInvite` — `team_id` → Team, `inviter_id` → User, `invitee_id` → User, `status`. `@@unique([team_id, invitee_id])`
  - `TeamGame` — composite PK `[team_id, game_id]`, many-to-many
- **Add User relations**: `team_memberships`, `team_invites_sent/received`, `created_teams`
- **Add TournamentRegistration relation**: `team` (FK to Team, onDelete: SetNull — makes existing `team_id` field functional)

### New DTOs
- `packages/shared/src/dto/team.dto.ts` — `TeamDto`, `CreateTeamDto`, `UpdateTeamDto`, `TeamMemberDto`, `TeamInviteDto`, `TeamWithMembersDto`

### Backend: New TeamsModule
**`apps/backend/src/modules/teams/`** (teams.module.ts, controller, service)

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /teams` | GAMER | Create team (creator → CAPTAIN) |
| `GET /teams/:id` | Public | Team profile |
| `PUT /teams/:id` | CAPTAIN | Update team |
| `DELETE /teams/:id` | CAPTAIN | Disband (preserves history) |
| `GET /teams` | Public | List/search teams |
| `POST /teams/:id/invites` | CAPTAIN | Invite user by ID |
| `PUT /teams/:id/invites/:inviteId/accept` | invitee | Accept invite |
| `PUT /teams/:id/invites/:inviteId/reject` | invitee | Reject invite |
| `DELETE /teams/:id/members/:userId` | CAPTAIN | Remove member / self-leave |
| `PUT /teams/:id/members/:userId/role` | CAPTAIN | Promote/demote |
| `GET /users/me/teams` | GAMER | Current + past teams |
| `GET /users/me/invites` | GAMER | Pending team invites |

### Frontend Changes
- **New pages**: `/teams` (my teams), `/teams/create`, `/teams/[id]` (detail), `/teams/[id]/edit`, `/teams/[id]/members` (roster mgmt)
- **New components**: `team-card`, `team-profile`, `roster-list`, `invite-dialog` (search-by-username), `team-selector` (for tournament registration), `user-teams-display` (on profile)
- **Update**: Public profile — add "Current Teams" + "Past Teams" sections
- **Update**: Sidebar — "Teams" nav item
- **Update**: Tournament registration flow — when `isTeamBased`, show team selector for captains

### Wire into AppModule
Import `TeamsModule` into `apps/backend/src/app.module.ts`.

---