## Phase 4: Discovery & Network

### Database
- Add index on `GamerProfile.display_name` (search performance)

### New DTOs
- `packages/shared/src/dto/discovery.dto.ts` — `UserSearchDto`, `UserSearchResultDto`, `PeopleYouMayKnowDto`, `DiscoveryResponse`, `GamePlayerDto`

### Backend: Extend UsersModule
New endpoints in `UsersController`:

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /users/search` | Public (optional auth) | Search by username/displayName/games |
| `GET /users/discover/people-you-may-know` | GAMER | Suggested connections |
| `GET /games/:slug/players` | Public | Find players by game |

**"People You May Know" algorithm** (request-time, no ML):
1. Shared games (sorted by count, descending)
2. Shared tournament/event participation
3. Mutual connections (friends-of-friends)
4. Shared team history
5. Exclude: self, already connected, pending requests
6. Return top 20 with `reason` field

### Frontend Changes
- **New**: `app/(dashboard)/discover/page.tsx` — 3 tabs: Search, People You May Know, By Game
- **New**: `components/discovery/user-search-card.tsx` — card with avatar, username, games, connect button
- **New**: `components/discovery/people-you-may-know.tsx` — dashboard widget (top 5 suggestions)
- **Update**: Dashboard — "People You May Know" section
- **Update**: Sidebar — "Discover" nav item

---