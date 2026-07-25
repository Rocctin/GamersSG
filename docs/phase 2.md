## Phase 2: Connection System

### Database Schema (Prisma migration)
- **New enum**: `ConnectionStatus` (PENDING, ACCEPTED, REJECTED)
- **New model**: `Connection` — `id`, `requester_id` → User, `addressee_id` → User, `status`, `created_at`, `updated_at`
  - `@@unique([requester_id, addressee_id])`
  - `@@index([addressee_id, status])`, `@@index([requester_id, status])`
- **User model**: add `sent_connections` and `received_connections` relations

### New DTOs
- `packages/shared/src/dto/connection.dto.ts` — `ConnectionDto`, `SendConnectionRequestDto`, `ConnectionListResponse`, `PendingRequestCountDto`

### Backend: New ConnectionsModule
**`apps/backend/src/modules/connections/`** (connections.module.ts, controller, service)

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /connections` | GAMER | Send request (body: `{addresseeId}`) |
| `PUT /connections/:id/accept` | GAMER | Accept incoming request |
| `PUT /connections/:id/reject` | GAMER | Reject incoming request |
| `DELETE /connections/:id` | GAMER | Cancel outgoing / remove connection |
| `GET /connections` | GAMER | List connections (filter by status, paginated) |
| `GET /connections/pending-count` | GAMER | Incoming pending count (sidebar badge) |
| `GET /users/:userId/connections/count` | Public | Connection count (profile display) |

**Business rules**: Can't connect to self; duplicate check; REJECTED allows re-send; only addressee can accept/reject; either party can remove ACCEPTED connections.

### Frontend Changes
- **New**: `app/(dashboard)/connections/page.tsx` — tabbed Connections/Pending (received/sent sub-tabs) with accept/reject/cancel/remove actions
- **New**: `components/connections/connect-button.tsx` — smart button for profile pages with states: Connect / Request Sent / Accept+Reject / Connected
- **New**: `components/connections/connection-card.tsx` — avatar + username + games in common + mutual count
- **Update**: Public profile page — add connect button + connection count
- **Update**: Sidebar — "Connections" nav item with pending count badge

### Wire into AppModule
Import `ConnectionsModule` into `apps/backend/src/app.module.ts`.

---